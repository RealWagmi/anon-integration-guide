import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, SupportedChain } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { getSwapsLiquidity } from './getSwapsLiquidity.js';
import { parseEventLogs } from 'viem';
import { getTokenAddress, getTokenDecimals, getChainFromName, type TokenSymbol } from '../../../utils.js';

interface Props {
    chainName: string;
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
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const { notify, getProvider, evm } = options;
    const sendTransactions = evm?.sendTransactions || options.sendTransactions;
    
    try {
        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainId !== SupportedChain.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Validate slippage
        if (slippageBps < 0 || slippageBps > 10000) {
            return toResult('Invalid slippage value. Must be between 0 and 10000 basis points', true);
        }

        // Get token addresses from token symbols
        const networkName = chainName.toLowerCase();
        const tokenInAddressResolved = getTokenAddress(tokenIn, networkName);
        const tokenOutAddressResolved = getTokenAddress(tokenOut, networkName);
        
        if (!tokenInAddressResolved) {
            return toResult(`Token ${tokenIn} not found on ${networkName}`, true);
        }
        if (!tokenOutAddressResolved) {
            return toResult(`Token ${tokenOut} not found on ${networkName}`, true);
        }

        // Check if tokens are the same
        if (tokenInAddressResolved === tokenOutAddressResolved) {
            return toResult('Cannot swap token for itself', true);
        }

        // Get user's token balances
        const balanceResult = await getUserTokenBalances({ chainName, account }, options);
        if (!balanceResult.success || !balanceResult.data) {
            return toResult('Failed to get token balances', true);
        }

        const balanceData = JSON.parse(balanceResult.data);
        const tokenInInfo = balanceData.tokens.find((t: any) => t.symbol === tokenIn);
        if (!tokenInInfo) {
            return toResult(`Token ${tokenIn} not found in user's balance`, true);
        }
        
        // Get token decimals
        const tokenInDecimals = getTokenDecimals(tokenIn, networkName);
        const tokenOutDecimals = getTokenDecimals(tokenOut, networkName);

        // Parse amount with safe conversion
        const amountInValue = parseFloat(amountIn);
        if (isNaN(amountInValue) || amountInValue <= 0) {
            return toResult('Invalid amount specified', true);
        }

        // Convert amount to contract units
        const amountInWei = parseUnits(amountIn, tokenInDecimals);

        // Check user's balance
        const userBalanceWei = parseUnits(tokenInInfo.balance, tokenInDecimals);
        
        if (userBalanceWei < amountInWei) {
            return toResult(
                `Insufficient ${tokenIn} balance. Required: ${amountIn}, Available: ${tokenInInfo.balance}`,
                true,
            );
        }

        // Check available liquidity
        const liquidityResult = await getSwapsLiquidity({ chainName, account }, options);
        if (!liquidityResult.success || !liquidityResult.data) {
            return toResult('Failed to get swap liquidity', true);
        }

        const liquidityData = JSON.parse(liquidityResult.data);
        const tokenOutLiquidity = liquidityData.liquidity.find((l: any) => l.symbol === tokenOut);
        if (!tokenOutLiquidity) {
            return toResult(`No liquidity available for ${tokenOut}`, true);
        }

        const provider = getProvider(chainId);

        // Determine the correct addresses for price fetching
        const tokenInPriceFeedAddress = tokenIn === 'S' 
            ? CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN 
            : tokenInAddressResolved;
        const tokenOutPriceFeedAddress = tokenOut === 'S' 
            ? CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN 
            : tokenOutAddressResolved;

        // Get token prices
        const [tokenInPrice, tokenOutPrice] = await Promise.all([
            provider.readContract({
                address: CONTRACT_ADDRESSES[chainId].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenInPriceFeedAddress, false, true, true],
            }) as Promise<bigint>,
            provider.readContract({
                address: CONTRACT_ADDRESSES[chainId].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenOutPriceFeedAddress, false, true, true],
            }) as Promise<bigint>,
        ]);

        if (!tokenInPrice || !tokenOutPrice) {
            return toResult('Failed to get token prices', true);
        }

        // Calculate expected output with safe conversion
        const amountInUsd = (amountInWei * tokenInPrice) / BigInt(10 ** tokenInDecimals);
        const expectedAmountOut_normalized18 = (amountInUsd * BigInt(10 ** 18)) / tokenOutPrice;
        const minAmountOut_normalized18 = (expectedAmountOut_normalized18 * BigInt(10000 - slippageBps)) / BigInt(10000);
        
        // Convert minAmountOut to tokenOut's actual decimals
        const minAmountOut_actualDecimals = (minAmountOut_normalized18 * BigInt(10 ** tokenOutDecimals)) / BigInt(10 ** 18);

        // Calculate price impact
        let priceImpactBps = BigInt(0);
        const availableLiquidity_actualUnits = parseUnits(tokenOutLiquidity.availableAmount, tokenOutDecimals);
        
        if (availableLiquidity_actualUnits > BigInt(0)) {
            const expectedAmountOut_actualUnits = (expectedAmountOut_normalized18 * BigInt(10 ** tokenOutDecimals)) / BigInt(10 ** 18);
            priceImpactBps = (expectedAmountOut_actualUnits * BigInt(10000)) / availableLiquidity_actualUnits;
        }

        // Warn if price impact is high
        if (priceImpactBps > BigInt(100)) { // 100 bps = 1%
            await notify(`Warning: High price impact (${formatUnits(priceImpactBps, 2)}%). Consider reducing the amount.`);
        }

        // Prepare transactions
        const { checkToApprove } = EVM.utils;
        const transactions: EVM.types.TransactionParams[] = [];

        // Add approval transaction if needed
        if (tokenIn !== 'S') {
            await checkToApprove({
                args: {
                    account,
                    target: tokenInAddressResolved, 
                    spender: CONTRACT_ADDRESSES[chainId].ROUTER,
                    amount: amountInWei,
                },
                provider,
                transactions,
            });
        }

        // Add swap transaction
        const path = tokenIn === 'S' 
            ? [CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN, tokenOutAddressResolved] 
            : tokenOut === 'S' 
                ? [tokenInAddressResolved, CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN] 
                : [tokenInAddressResolved, tokenOutAddressResolved];

        const selectedFunctionName = tokenIn === 'S' 
            ? 'swapETHToTokens' 
            : tokenOut === 'S' 
                ? 'swapTokensToETH' 
                : 'swap';

        let swapArgs: any[];
        if (selectedFunctionName === 'swapETHToTokens') {
            swapArgs = [path, minAmountOut_actualDecimals, account]; // args: _path, _minOut, _receiver
        } else {
            // For swapTokensToETH and swap (token-to-token)
            swapArgs = [path, amountInWei, minAmountOut_actualDecimals, account]; // args: _path, _amountIn, _minOut, _receiver
        }

        const swapData = encodeFunctionData({
            abi: Router,
            functionName: selectedFunctionName,
            args: swapArgs,
        });

        transactions.push({
            target: CONTRACT_ADDRESSES[chainId].ROUTER,
            data: swapData,
            value: tokenIn === 'S' ? amountInWei.toString() : undefined,
        });

        // Send transactions
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
        const swapLogs = parseEventLogs({
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
            eventName: 'Swap',
            logs: receipt.logs,
        });

        if (swapLogs.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        tokenIn,
                        tokenOut,
                        amountIn: formatUnits(amountInWei, tokenInDecimals),
                        amountOut: formatUnits(minAmountOut_actualDecimals, tokenOutDecimals),
                        amountInUsd: formatUnits(amountInUsd, 30),
                        amountOutUsd: formatUnits((minAmountOut_actualDecimals * tokenOutPrice) / BigInt(10 ** tokenOutDecimals), 30),
                        priceImpact: formatUnits(priceImpactBps, 2),
                        executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                        minAmountOut: formatUnits(minAmountOut_actualDecimals, tokenOutDecimals),
                        warning: 'Could not parse Swap event from transaction receipt',
                    },
                } as SwapResult),
            );
        }

        // Get the swap event
        const swapEvent = swapLogs[0];

        // Return data with all numeric values as strings
        return toResult(
            JSON.stringify({
                success: true,
                hash: result.data[0].hash,
                details: {
                    tokenIn,
                    tokenOut,
                    amountIn: formatUnits(amountInWei, tokenInDecimals),
                    amountOut: formatUnits(swapEvent.args.amountOutAfterFees, tokenOutDecimals),
                    amountInUsd: formatUnits(amountInUsd, 30),
                    amountOutUsd: formatUnits((swapEvent.args.amountOutAfterFees * tokenOutPrice) / BigInt(10 ** tokenOutDecimals), 30),
                    priceImpact: formatUnits(priceImpactBps, 2),
                    executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                    minAmountOut: formatUnits(minAmountOut_actualDecimals, tokenOutDecimals),
                },
            } as SwapResult),
        );
    } catch (error) {
        return toResult(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
