import { parseUnits, encodeFunctionData, formatUnits, Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { decodeEventLog } from 'viem';

interface Props {
    chainName: string;
    account: Address;
    tokenOut: Address;
    amount: string;
    slippageTolerance?: number;
    skipSafetyChecks?: boolean;
}

/**
 * Removes liquidity from the ALP pool
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to remove liquidity for
 * @param props.tokenOut - The token address to receive when removing liquidity
 * @param props.amount - The amount of ALP to remove in decimal format
 * @param props.slippageTolerance - Optional slippage tolerance in percentage (default: 0.5)
 * @param props.skipSafetyChecks - Optional flag to skip liquidity checks (default: false)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with removal details
 */
export async function removeLiquidity(
    { chainName, account, tokenOut, amount, slippageTolerance = 0.5, skipSafetyChecks = false }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (chainName !== NETWORKS.SONIC) {
        return toResult(`Protocol is only supported on Sonic chain`, true);
    }

    try {
        const publicClient = getProvider(chainId);

        // Validate amount format
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return toResult('Amount must be greater than zero', true);
        }

        // Convert amount to wei with safe conversion
        const amountInWei = parseUnits(parsedAmount.toString(), 18);

        // Get token-specific details first
        const isNativeToken = tokenOut.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase();
        const tokenAddress = isNativeToken ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN : tokenOut;

        // Get token decimals
        const decimals = 18; // All tokens in the protocol use 18 decimals
        let minOutInTokenWei: bigint;

        if (!skipSafetyChecks) {
            await notify('Performing safety checks...');

            // First check user's available ALP balance
            const userLiquidityResult = await getUserLiquidity(
                {
                    chainName,
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
            const poolLiquidityResult = await getPoolLiquidity({ chainName }, { getProvider, notify, sendTransactions });
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
                return t.address.toLowerCase() === tokenAddress.toLowerCase();
            });

            if (!tokenInfo || !tokenInfo.price || !tokenInfo.availableAmount) {
                return toResult(`Token ${tokenOut} not found in pool`, true);
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
                return toResult(`Insufficient pool liquidity for ${isNativeToken ? 'S' : tokenInfo.symbol}. ` + 
                    `Required: ${minOutAmount.toFixed(decimals)}, Available: ${tokenAvailableFormatted}`, true);
            }

            // Additional safety check for extreme price impact
            const priceImpact = (minOutAmount / tokenAvailableFormatted) * 100;
            if (priceImpact > 10) {
                return toResult(
                    `Removal amount too large for ${isNativeToken ? 'S' : tokenInfo.symbol} - would cause significant price impact (${priceImpact.toFixed(2)}%). ` +
                        `Consider reducing the amount or splitting into multiple transactions.`,
                    true,
                );
            }
        } else {
            // If skipping safety checks, use a default minOut based on amount and slippage
            const minOutAmount = parsedAmount * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);
        }

        await notify('Preparing to remove liquidity...');

        // Prepare transaction based on output token type
        const tx: TransactionParams = {
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            data: isNativeToken
                ? encodeFunctionData({
                      abi: RewardRouter,
                      functionName: 'unstakeAndRedeemGlpETH',
                      args: [amountInWei, minOutInTokenWei, account],
                  })
                : encodeFunctionData({
                      abi: RewardRouter,
                      functionName: 'unstakeAndRedeemGlp',
                      args: [tokenOut, amountInWei, minOutInTokenWei, account],
                  }),
        };

        // Send transaction
        const result = await sendTransactions({
            chainId,
            account,
            transactions: [tx],
        });

        if (!result.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        // Get transaction receipt and parse RemoveLiquidity event
        const receipt = await publicClient.getTransactionReceipt({ hash: result.data[0].hash });

        const removeLiquidityEvents = receipt.logs.filter(log => {
            return log.address.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER.toLowerCase() &&
                   log.topics[0] === '0x87bf7b546c8de873abb0db5b579ec131f8d0cf5b14f39465d1343acee7584845'; // keccak256('RemoveLiquidity(address,address,uint256,uint256,uint256,uint256,uint256)')
        });

        if (removeLiquidityEvents.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        amount: formatUnits(amountInWei, 18),
                        tokenOut,
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
            decodedEvent.args.token.toLowerCase() !== tokenAddress.toLowerCase() ||
            decodedEvent.args.glpAmount !== amountInWei) {
            return toResult(
                `Remove liquidity event validation failed. Expected account ${account}, token ${tokenAddress}, and amount ${amountInWei}, but got account ${decodedEvent.args.account}, token ${decodedEvent.args.token}, and amount ${decodedEvent.args.glpAmount}`,
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
                hash: result.data[0].hash,
                details: {
                    amount: formatUnits(amountInWei, 18),
                    tokenOut,
                    minOut: formatUnits(minOutInTokenWei, decimals),
                    receivedAmount: formatUnits(decodedEvent.args.amountOut, decimals),
                    aumInUsdg: formatUnits(decodedEvent.args.aumInUsdg, 18),
                    glpSupply: formatUnits(decodedEvent.args.glpSupply, 18),
                    usdgAmount: formatUnits(decodedEvent.args.usdgAmount, 18),
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
