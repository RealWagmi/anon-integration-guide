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
import { getTokenAddress, type TokenSymbol } from '../../../utils/tokens.js';

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

        // Get token addresses from token symbols
        const networkName = chainName.toLowerCase();
        let tokenInAddressResolved: Address;
        let tokenOutAddressResolved: Address;
        try {
            tokenInAddressResolved = getTokenAddress(tokenIn, networkName);
            tokenOutAddressResolved = getTokenAddress(tokenOut, networkName);
        } catch (error) {
            return toResult(`Token error: ${error.message}`, true);
        }

        // Check if tokens are the same
        if (tokenInAddressResolved === tokenOutAddressResolved) {
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
        // Get tokenOut info for its decimals
        const tokenOutInfo = balanceData.tokens.find((t: any) => t.symbol === tokenOut);
        if (!tokenOutInfo) {
            // This case might not be strictly necessary if tokenOut isn't held, 
            // but decimals are needed. Consider fetching token info separately if not in balances.
            // For now, assume it might be found or we need a fallback/error.
            // A robust way would be to have a separate get token info utility.
            // However, getUserTokenBalances should ideally return all relevant tokens from the token list.
            return toResult(`Token ${tokenOut} info (for decimals) not found. Ensure it's in the token list used by getUserTokenBalances.`, true);
        }

        // Parse amount with safe conversion
        const amountInValue = parseFloat(amountIn);
        if (isNaN(amountInValue) || amountInValue <= 0) {
            return toResult('Invalid amount specified', true);
        }

        // Convert amount to contract units
        const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);

        // Check user's balance
        try {
            // Safely convert the balance to a BigInt by first multiplying to get rid of decimals
            const userBalanceNum = parseFloat(tokenInInfo.balance);
            const decimals = tokenInInfo.decimals;
            const userBalanceWei = parseUnits(tokenInInfo.balance, decimals);
            
            if (userBalanceWei < amountInWei) {
                return toResult(
                    `Insufficient ${tokenIn} balance. Required: ${amountIn}, Available: ${tokenInInfo.balance}`,
                    true,
                );
            }
        } catch (error) {
            return toResult(`ERROR: Failed to execute swap: ${error.message}`, true);
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

        // Determine the correct addresses for price fetching
        const tokenInPriceFeedAddress = tokenIn === 'S' 
            ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN 
            : tokenInAddressResolved;
        const tokenOutPriceFeedAddress = tokenOut === 'S' 
            ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN 
            : tokenOutAddressResolved;

        // Get token prices
        const [tokenInPrice, tokenOutPrice] = await Promise.all([
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenInPriceFeedAddress, false, true, true], // Use potentially wrapped address
            }) as Promise<bigint>,
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [tokenOutPriceFeedAddress, false, true, true], // Use potentially wrapped address
            }) as Promise<bigint>,
        ]);

        if (!tokenInPrice || !tokenOutPrice) {
            return toResult('Failed to get token prices', true);
        }

        // Calculate expected output with safe conversion
        const amountInUsd = (amountInWei * tokenInPrice) / BigInt(10 ** tokenInInfo.decimals);
        const expectedAmountOut_normalized18 = (amountInUsd * BigInt(10 ** 18)) / tokenOutPrice; // Price is likely 18-decimal based
        const minAmountOut_normalized18 = (expectedAmountOut_normalized18 * BigInt(10000 - slippageBps)) / BigInt(10000);
        
        // Convert minAmountOut to tokenOut's actual decimals
        const minAmountOut_actualDecimals = (minAmountOut_normalized18 * BigInt(10 ** tokenOutInfo.decimals)) / BigInt(10 ** 18);

        // Calculate price impact
        let priceImpactBps = BigInt(0); // Changed to BigInt and BPS for clarity
        try {
            // availableAmount is a string representing float, parseUnits needs its actual decimals
            const availableLiquidity_actualUnits = parseUnits(tokenOutLiquidity.availableAmount, tokenOutInfo.decimals);
            
            if (availableLiquidity_actualUnits > BigInt(0)) {
                // To calculate price impact, compare expected out (in actual units) vs available liquidity (in actual units)
                const expectedAmountOut_actualUnits = (expectedAmountOut_normalized18 * BigInt(10 ** tokenOutInfo.decimals)) / BigInt(10 ** 18);
                priceImpactBps = (expectedAmountOut_actualUnits * BigInt(10000)) / availableLiquidity_actualUnits;
            }
        } catch (error) {
            await notify(`Warning: Could not calculate price impact: ${error.message}`);
            priceImpactBps = BigInt(0);
        }

        // Warn if price impact is high
        if (priceImpactBps > BigInt(100)) { // 100 bps = 1%
            await notify(`Warning: High price impact (${formatUnits(priceImpactBps, 2)}%). Consider reducing the amount.`);
        }

        // Prepare transactions
        const transactions: TransactionParams[] = [];

        // Add approval transaction if needed
        if (tokenIn !== 'S') {
            await notify('Checking token approval...');
            await checkToApprove({
                args: {
                    account,
                    target: tokenInAddressResolved, 
                    spender: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
                    amount: amountInWei,
                },
                provider,
                transactions,
            });
        }

        // Add swap transaction
        const path = tokenIn === 'S' 
            ? [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, tokenOutAddressResolved] 
            : tokenOut === 'S' 
                ? [tokenInAddressResolved, CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN] 
                : [tokenInAddressResolved, tokenOutAddressResolved];

        const selectedFunctionName = tokenIn === 'S' 
            ? 'swapETHToTokens' 
            : tokenOut === 'S' 
                ? 'swapTokensToETH' 
                : 'swap'; // Use 'swap' for generic token-to-token as per Router ABI

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
                        amountOut: formatUnits(minAmountOut_actualDecimals, tokenOutInfo.decimals),
                        amountInUsd: formatUnits(amountInUsd, 30),
                        amountOutUsd: formatUnits((minAmountOut_actualDecimals * tokenOutPrice) / BigInt(10 ** tokenOutInfo.decimals), 30),
                        priceImpact: formatUnits(priceImpactBps, 2),
                        executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                        minAmountOut: formatUnits(minAmountOut_actualDecimals, tokenOutInfo.decimals),
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
                    priceImpact: formatUnits(priceImpactBps, 2),
                    executionPrice: formatUnits((tokenInPrice * BigInt(1e18)) / tokenOutPrice, 18),
                    minAmountOut: formatUnits(minAmountOut_actualDecimals, tokenOutInfo.decimals),
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
