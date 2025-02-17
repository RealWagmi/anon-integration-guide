import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { getSwapsLiquidity } from './getSwapsLiquidity.js';
import { decodeEventLog } from 'viem';

type TokenSymbol = 'S' | 'WS' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    tokenIn: TokenSymbol;
    tokenOut: TokenSymbol;
    amountIn: string;
    slippageBps?: number;
}

interface SwapResult {
    success: boolean;
    hash: string;
    details: {
        tokenIn: TokenSymbol;
        tokenOut: TokenSymbol;
        amountIn: string;
        amountOut: string;
        amountInUsd: string;
        amountOutUsd: string;
        priceImpact: string;
        executionPrice: string;
        minAmountOut: string;
    };
}

function getTokenAddress(symbol: TokenSymbol): Address {
    switch (symbol) {
        case 'S':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
        case 'WS':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN;
        case 'WETH':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH;
        case 'ANON':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;
        case 'USDC':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC;
        case 'EURC':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC;
        default:
            throw new Error(`Unsupported token symbol: ${symbol}`);
    }
}

/**
 * Executes a market swap between two tokens on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address executing the swap
 * @param props.tokenIn - Symbol of the token to swap from
 * @param props.tokenOut - Symbol of the token to swap to
 * @param props.amountIn - Amount of input token to swap (in token decimals)
 * @param props.slippageBps - Optional slippage tolerance in basis points (1 bps = 0.01%). Defaults to 100 (1%)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with swap details
 */
export async function marketSwap(
    { chainName, account, tokenIn, tokenOut, amountIn, slippageBps = 100 }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Validate slippage
        if (slippageBps < 0 || slippageBps > 10000) {
            return toResult('Invalid slippage value. Must be between 0 and 10000 basis points', true);
        }

        // Get token addresses
        const tokenInAddress = getTokenAddress(tokenIn);
        const tokenOutAddress = getTokenAddress(tokenOut);

        // Check if tokens are the same
        if (tokenInAddress === tokenOutAddress) {
            return toResult('Cannot swap token for itself', true);
        }

        await notify('Checking token balances and liquidity...');

        // Get user's token balances
        const balanceResult = await getUserTokenBalances({ chainName, account }, { getProvider, notify, sendTransactions });
        if (!balanceResult.success || !balanceResult.data) {
            return toResult('Failed to get token balances', true);
        }

        const balanceData = JSON.parse(balanceResult.data);
        const tokenInInfo = balanceData.tokens.find((t: any) => t.symbol === tokenIn);
        if (!tokenInInfo) {
            return toResult(`Token ${tokenIn} not found in user's balance`, true);
        }

        // Parse amount with safe conversion
        const amountInValue = parseFloat(amountIn);
        if (isNaN(amountInValue) || amountInValue <= 0) {
            return toResult('Invalid amount specified', true);
        }

        // Convert amount to contract units
        const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);

        // Check user's balance
        const userBalance = BigInt(tokenInInfo.balance);
        if (userBalance < amountInWei) {
            return toResult(
                `Insufficient ${tokenIn} balance. Required: ${amountIn}, Available: ${formatUnits(userBalance, tokenInInfo.decimals)}`,
                true,
            );
        }

        // Check available liquidity
        const liquidityResult = await getSwapsLiquidity({ chainName, account }, { getProvider, notify, sendTransactions });
        if (!liquidityResult.success || !liquidityResult.data) {
            return toResult('Failed to get swap liquidity', true);
        }

        const liquidityData = JSON.parse(liquidityResult.data);
        const tokenOutLiquidity = liquidityData.liquidity.find((l: any) => l.symbol === tokenOut);
        if (!tokenOutLiquidity) {
            return toResult(`No liquidity available for ${tokenOut}`, true);
        }

        const provider = getProvider(chainId);

        // Get token prices
        const [tokenInPrice, tokenOutPrice] = await Promise.all([
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenInAddress, false, true, true],
            }) as Promise<bigint>,
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenOutAddress, false, true, true],
            }) as Promise<bigint>,
        ]);

        if (!tokenInPrice || !tokenOutPrice) {
            return toResult('Failed to get token prices', true);
        }

        // Calculate expected output with safe conversion
        const amountInUsd = (amountInWei * tokenInPrice) / BigInt(10 ** tokenInInfo.decimals);
        const expectedAmountOut = (amountInUsd * BigInt(10 ** 18)) / tokenOutPrice;
        const minAmountOut = (expectedAmountOut * BigInt(10000 - slippageBps)) / BigInt(10000);

        // Calculate price impact
        const availableLiquidity = BigInt(tokenOutLiquidity.availableAmount);
        const priceImpact = ((expectedAmountOut * BigInt(10000)) / availableLiquidity).toString();

        // Warn if price impact is high
        if (Number(priceImpact) > 100) {
            await notify(`Warning: High price impact (${(Number(priceImpact) / 100).toFixed(2)}%). Consider reducing the amount.`);
        }

        // Prepare transactions
        const transactions: TransactionParams[] = [];

        // Add approval transaction if needed
        if (tokenIn !== 'S') {
            await notify('Checking token approval...');
            await checkToApprove({
                args: {
                    account,
                    target: tokenInAddress,
                    spender: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
                    amount: amountInWei,
                },
                provider,
                transactions,
            });
        }

        // Add swap transaction
        const swapData = encodeFunctionData({
            abi: Router,
            functionName: tokenIn === 'S' ? 'swapETHToTokens' : tokenOut === 'S' ? 'swapTokensToETH' : 'swapTokensToTokens',
            args: [
                tokenIn === 'S' ? [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, tokenOutAddress] : 
                tokenOut === 'S' ? [tokenInAddress, CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN] :
                [tokenInAddress, tokenOutAddress],
                amountInWei,
                minAmountOut,
                account,
            ],
        });

        transactions.push({
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
            data: swapData,
            value: tokenIn === 'S' ? amountInWei : BigInt(0),
        });

        // Send transactions
        await notify('Executing swap...');
        const result = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        if (!result.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        // Get transaction receipt and parse Swap event
        const receipt = await provider.getTransactionReceipt({ hash: result.data[0].hash });
        const swapEvents = receipt.logs.filter(log => {
            return log.address.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT.toLowerCase() &&
                   log.topics[0] === '0x9e8c68d6c0f6f0d65e0785f1a1f101c20ff9d87a7a8de0185e5092a41e907b93'; // keccak256('Swap(address,address,address,uint256,uint256,uint256,uint256)')
        });

        if (swapEvents.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        tokenIn,
                        tokenOut,
                        amountIn: formatUnits(amountInWei, tokenInInfo.decimals),
                        amountOut: formatUnits(minAmountOut, 18),
                        amountInUsd: formatUnits(amountInUsd, 30),
                        amountOutUsd: formatUnits((minAmountOut * tokenOutPrice) / BigInt(1e18), 30),
                        priceImpact: (Number(priceImpact) / 100).toFixed(4),
                        executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                        minAmountOut: formatUnits(minAmountOut, 18),
                        warning: 'Could not parse Swap event from transaction receipt',
                    },
                } as SwapResult),
            );
        }

        // Parse the event data
        const eventData = swapEvents[0];
        const decodedEvent = decodeEventLog({
            abi: [{
                anonymous: false,
                inputs: [
                    { indexed: false, name: 'account', type: 'address' },
                    { indexed: false, name: 'tokenIn', type: 'address' },
                    { indexed: false, name: 'tokenOut', type: 'address' },
                    { indexed: false, name: 'amountIn', type: 'uint256' },
                    { indexed: false, name: 'amountOut', type: 'uint256' },
                    { indexed: false, name: 'amountOutAfterFees', type: 'uint256' },
                    { indexed: false, name: 'feeBasisPoints', type: 'uint256' }
                ],
                name: 'Swap',
                type: 'event'
            }],
            data: eventData.data,
            topics: eventData.topics
        });

        // Return data with all numeric values as strings
        return toResult(
            JSON.stringify({
                success: true,
                hash: result.data[0].hash,
                details: {
                    tokenIn,
                    tokenOut,
                    amountIn: formatUnits(amountInWei, tokenInInfo.decimals),
                    amountOut: formatUnits(decodedEvent.args.amountOutAfterFees, 18),
                    amountInUsd: formatUnits(amountInUsd, 30),
                    amountOutUsd: formatUnits((decodedEvent.args.amountOutAfterFees * tokenOutPrice) / BigInt(1e18), 30),
                    priceImpact: (Number(priceImpact) / 100).toFixed(4),
                    executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                    minAmountOut: formatUnits(minAmountOut, 18),
                },
            } as SwapResult),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to execute swap: ${error.message}`, true);
        }
        return toResult('Failed to execute swap: Unknown error', true);
    }
}
