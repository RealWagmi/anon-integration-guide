import { parseUnits, encodeFunctionData, formatUnits, Address, type TransactionReceipt } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, TransactionParams } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;
import { CONTRACT_ADDRESSES, SupportedChain } from '../../constants.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { decodeEventLog } from 'viem';
import { TokenSymbol, getTokenAddress } from '../../utils.js';

interface Props {
    chainName: 'sonic' | 'base';
    account: Address;
    tokenOutSymbol: TokenSymbol;
    amount: string;
    slippageTolerance?: number;
    skipSafetyChecks?: boolean;
}

/**
 * Removes liquidity from the ALP pool
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to remove liquidity for
 * @param props.tokenOutSymbol - The symbol of the token to receive when removing liquidity (e.g., "S", "USDC")
 * @param props.amount - The amount of ALP to remove in decimal format
 * @param props.slippageTolerance - Optional slippage tolerance in percentage (default: 0.5)
 * @param props.skipSafetyChecks - Optional flag to skip liquidity checks (default: false)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with removal details
 */
export async function removeLiquidity(
    { chainName, account, tokenOutSymbol, amount, slippageTolerance = 0.5, skipSafetyChecks = false }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const { notify, getProvider, evm } = options;
    const sendTransactions = evm?.sendTransactions || options.sendTransactions;
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    
    if (chainId !== SupportedChain.SONIC) {
        return toResult(`Protocol is only supported on Sonic chain`, true);
    }

    const currentNetworkContracts = CONTRACT_ADDRESSES[chainId];
    const networkName = chainName.toLowerCase();

    try {
        const publicClient = getProvider(chainId);

        // Resolve tokenOutSymbol to an address and determine if it's native
        const isNativeRedemption = (chainId === SupportedChain.SONIC && tokenOutSymbol === 'S');
        
        let tokenOutAddressContract: Address;
        let addressForPoolLookup: Address;

        if (isNativeRedemption) {
            addressForPoolLookup = currentNetworkContracts.WRAPPED_NATIVE_TOKEN;
            tokenOutAddressContract = currentNetworkContracts.NATIVE_TOKEN; 
        } else {
            const resolvedAddress = getTokenAddress(tokenOutSymbol, networkName);
            if (!resolvedAddress) {
                return toResult(`Token symbol ${tokenOutSymbol} not found or not supported on ${networkName}.`, true);
            }
            tokenOutAddressContract = resolvedAddress;
            addressForPoolLookup = resolvedAddress;
        }

        // Validate amount format
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return toResult('Amount must be greater than zero', true);
        }

        // Convert amount to wei with safe conversion
        const amountInWei = parseUnits(parsedAmount.toString(), 18);

        // Get token decimals
        const decimals = 18; // All tokens in the protocol use 18 decimals
        let minOutInTokenWei: bigint;

        if (!skipSafetyChecks) {
            // First check user's available ALP balance
            const userLiquidityResult = await getUserLiquidity(
                {
                    chainName: chainName,
                    account,
                },
                { getProvider, notify, sendTransactions },
            );

            if (!userLiquidityResult.success || !userLiquidityResult.data) {
                return userLiquidityResult;
            }

            const userLiquidity = JSON.parse(userLiquidityResult.data);
            if (!userLiquidity || !userLiquidity.availableAmount) {
                return toResult('Invalid user liquidity data returned', true);
            }

            const userAvailableAmount = parseUnits(userLiquidity.availableAmount, 18);

            if (amountInWei > userAvailableAmount) {
                return toResult(`Insufficient available ALP. Requested: ${amount}, Available: ${userLiquidity.availableAmount}`, true);
            }

            // Then check pool liquidity and calculate minOut based on current price
            const poolLiquidityResult = await getPoolLiquidity(
                {
                    chainName: chainName,
                    publicClient
                },
                { getProvider, notify, sendTransactions }
            );
            if (!poolLiquidityResult.success || !poolLiquidityResult.data) {
                return poolLiquidityResult;
            }

            const poolData = JSON.parse(poolLiquidityResult.data);
            if (!poolData || !poolData.aum || !poolData.totalSupply) {
                return toResult('Invalid pool data returned', true);
            }

            const glpPrice = Number(poolData.aum) / Number(poolData.totalSupply);
            if (isNaN(glpPrice)) {
                return toResult('Invalid GLP price calculation', true);
            }

            const amountUsd = parsedAmount * glpPrice;

            // Get token price and available liquidity
            const tokenInfo = poolData.tokens.find((t: any) => {
                if (!t || !t.address) return false;
                return t.address.toLowerCase() === addressForPoolLookup.toLowerCase();
            });

            if (!tokenInfo || !tokenInfo.price || !tokenInfo.availableAmount) {
                return toResult(`Token details for symbol ${tokenOutSymbol} (address ${addressForPoolLookup}) not found in pool`, true);
            }

            const tokenPriceFormatted = Number(tokenInfo.price);
            const tokenAvailableFormatted = Number(tokenInfo.availableAmount);

            if (isNaN(tokenPriceFormatted) || isNaN(tokenAvailableFormatted)) {
                return toResult('Invalid token price or available amount', true);
            }

            // Calculate minOut with slippage tolerance
            const minOutAmount = (amountUsd / tokenPriceFormatted) * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);

            // Check if pool has enough available liquidity
            if (minOutAmount > tokenAvailableFormatted) {
                return toResult(`Insufficient pool liquidity for ${tokenOutSymbol}. ` +
                    `Required: ${minOutAmount.toFixed(decimals)}, Available: ${tokenAvailableFormatted}`, true);
            }

            // Additional safety check for extreme price impact
            const priceImpact = (minOutAmount / tokenAvailableFormatted) * 100;
            if (priceImpact > 10) {
                return toResult(
                    `Removal amount too large for ${tokenOutSymbol} - would cause significant price impact (${priceImpact.toFixed(2)}%). ` +
                        `Consider reducing the amount or splitting into multiple transactions.`,
                    true,
                );
            }
        } else {
            // If skipping safety checks, use a default minOut based on amount and slippage
            const minOutAmount = parsedAmount * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);
        }

        // Prepare transaction based on output token type
        const tx: TransactionParams = {
            target: currentNetworkContracts.REWARD_ROUTER,
            data: isNativeRedemption
                ? encodeFunctionData({
                      abi: RewardRouter,
                      functionName: 'unstakeAndRedeemGlpETH',
                      args: [amountInWei, minOutInTokenWei, account],
                  })
                : encodeFunctionData({
                      abi: RewardRouter,
                      functionName: 'unstakeAndRedeemGlp',
                      args: [tokenOutAddressContract, amountInWei, minOutInTokenWei, account],
                  }),
        };

        // Send transaction
        const sendTxInitialResult = await sendTransactions({
            chainId,
            account,
            transactions: [tx],
        });

        if (!sendTxInitialResult.data?.[0]?.hash) {
            // Use a more generic error message if sendTxInitialResult.data itself is the error string
            const errorMessage = typeof sendTxInitialResult.data === 'string' 
                ? sendTxInitialResult.data 
                : 'Transaction failed: No transaction hash returned';
            return toResult(errorMessage, true);
        }

        const txHash = sendTxInitialResult.data[0].hash;
        // Get transaction receipt with retry logic
        let receipt: TransactionReceipt | null = null;
        let attempts = 0;
        const maxAttempts = 5;
        const retryDelayMs = 3000;

        while (attempts < maxAttempts) {
            try {
                receipt = await publicClient.getTransactionReceipt({ hash: txHash });
                if (receipt) {
                    break; // Exit loop if receipt is found
                }
            } catch (e) {
                // Log error during attempts, but continue retrying
            }
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        }

        if (!receipt) {
            return toResult(
                JSON.stringify({
                    success: true, // Transaction was sent
                    hash: txHash,
                    details: {
                        amount: formatUnits(amountInWei, 18),
                        tokenOutSymbol,
                        minOut: formatUnits(minOutInTokenWei, decimals),
                        warning: `Transaction sent (${txHash}), but receipt could not be fetched after ${maxAttempts} attempts.`
                    },
                }),
            );
        }

        if (receipt.status !== 'success') {
            return toResult(`Transaction ${txHash} failed with status: ${receipt.status}`, true);
        }

        const removeLiquidityEvents = receipt.logs.filter(log => {
            return log.address.toLowerCase() === currentNetworkContracts.GLP_MANAGER.toLowerCase() &&
                   log.topics[0] === '0x87b9679bb9a4944bafa98c267e7cd4a00ab29fed48afdefae25f0fca5da27940'; // Updated Event Signature Hash from SonicScan
        });

        if (removeLiquidityEvents.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: txHash,
                    details: {
                        amount: formatUnits(amountInWei, 18),
                        tokenOutSymbol,
                        minOut: formatUnits(minOutInTokenWei, decimals),
                        warning: 'Could not parse RemoveLiquidity event from transaction receipt'
                    },
                }),
            );
        }

        // Parse the event data
        const eventData = removeLiquidityEvents[0];
        const decodedEvent = decodeEventLog({
            abi: [{
                anonymous: false,
                inputs: [
                    { indexed: false, name: 'account', type: 'address' },
                    { indexed: false, name: 'token', type: 'address' },
                    { indexed: false, name: 'glpAmount', type: 'uint256' },
                    { indexed: false, name: 'aumInUsdg', type: 'uint256' },
                    { indexed: false, name: 'glpSupply', type: 'uint256' },
                    { indexed: false, name: 'usdgAmount', type: 'uint256' },
                    { indexed: false, name: 'amountOut', type: 'uint256' }
                ],
                name: 'RemoveLiquidity',
                type: 'event'
            }],
            data: eventData.data,
            topics: eventData.topics
        });

        // Verify the event data matches our expectations
        if (decodedEvent.args.account.toLowerCase() !== account.toLowerCase() ||
            decodedEvent.args.token.toLowerCase() !== addressForPoolLookup.toLowerCase() ||
            decodedEvent.args.glpAmount !== amountInWei) {
            return toResult(
                `Remove liquidity event validation failed. Expected account ${account}, token ${addressForPoolLookup}, and amount ${amountInWei}, but got account ${decodedEvent.args.account}, token ${decodedEvent.args.token}, and amount ${decodedEvent.args.glpAmount}`,
                true
            );
        }

        // Verify the amount received is not less than minOut
        if (decodedEvent.args.amountOut < minOutInTokenWei) {
            return toResult(
                `Received amount ${decodedEvent.args.amountOut} is less than minimum expected ${minOutInTokenWei}`,
                true
            );
        }

        // Return data with all numeric values as strings
        return toResult(
            JSON.stringify({
                success: true,
                hash: txHash,
                details: {
                    amount: formatUnits(amountInWei, 18),
                    tokenOutSymbol,
                    minOut: formatUnits(minOutInTokenWei, decimals),
                    amountReceived: formatUnits(decodedEvent.args.amountOut, decimals),
                },
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to remove liquidity: ${error.message}`, true);
        }
        return toResult('Failed to remove liquidity: Unknown error', true);
    }
}
