import { parseUnits, encodeFunctionData, formatUnits, Abi, Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';

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
        const amountInWei = parseUnits(amount, 18);

        // Get token-specific details first
        const isNativeToken = tokenOut.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase();
        const outputToken = getContract({
            address: isNativeToken ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH : tokenOut,
            abi: ERC20,
            publicClient,
        });

        // Get token decimals
        const decimals = await outputToken.read.decimals();
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

            if (!userLiquidityResult.success) {
                return userLiquidityResult;
            }

            const userLiquidity = JSON.parse(userLiquidityResult.data);
            const userAvailableAmount = parseUnits(userLiquidity.availableAmount, 18);

            if (amountInWei > userAvailableAmount) {
                return toResult(`Insufficient available ALP. Requested: ${amount}, Available: ${userLiquidity.availableAmount}`, true);
            }

            // Then check pool liquidity and calculate minOut based on current price
            const poolLiquidityResult = await getPoolLiquidity({ chainName }, { getProvider, notify, sendTransactions });
            if (!poolLiquidityResult.success) {
                return poolLiquidityResult;
            }

            const poolData = JSON.parse(poolLiquidityResult.data);
            const glpPrice = Number(poolData.aum) / Number(poolData.totalSupply);
            const amountUsd = Number(amount) * glpPrice;

            // Get token price and available liquidity
            const vault = getContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                abi: [
                    {
                        inputs: [{ name: '_token', type: 'address' }],
                        name: 'getMinPrice',
                        outputs: [{ type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function',
                    },
                    {
                        inputs: [{ name: '_token', type: 'address' }],
                        name: 'poolAmounts',
                        outputs: [{ type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function',
                    },
                    {
                        inputs: [{ name: '_token', type: 'address' }],
                        name: 'reservedAmounts',
                        outputs: [{ type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function',
                    },
                ],
                publicClient,
            });

            const [tokenPrice, poolAmount, reservedAmount] = await Promise.all([
                vault.read.getMinPrice([tokenOut]),
                vault.read.poolAmounts([tokenOut]),
                vault.read.reservedAmounts([tokenOut]),
            ]);

            const tokenPriceFormatted = Number(formatUnits(tokenPrice, 30));
            const tokenAvailableAmount = poolAmount - reservedAmount;
            const tokenAvailableFormatted = Number(formatUnits(tokenAvailableAmount, decimals));

            // Calculate minOut with slippage tolerance
            const minOutAmount = (amountUsd / tokenPriceFormatted) * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);

            // Check if pool has enough available liquidity
            if (minOutAmount > tokenAvailableFormatted) {
                const symbol = isNativeToken ? 'S' : await outputToken.read.symbol();
                return toResult(`Insufficient pool liquidity for ${symbol}. ` + `Required: ${minOutAmount.toFixed(decimals)}, Available: ${tokenAvailableFormatted}`, true);
            }

            // Additional safety check for extreme price impact
            const priceImpact = (minOutAmount / tokenAvailableFormatted) * 100;
            if (priceImpact > 10) {
                // If removing more than 10% of available liquidity
                const symbol = isNativeToken ? 'S' : await outputToken.read.symbol();
                return toResult(
                    `Removal amount too large for ${symbol} - would cause significant price impact (${priceImpact.toFixed(2)}%). ` +
                        `Consider reducing the amount or splitting into multiple transactions.`,
                    true,
                );
            }
        } else {
            // If skipping safety checks, use a default minOut based on amount and slippage
            const minOutAmount = Number(amount) * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);
        }

        await notify('Preparing to remove liquidity...');

        // Prepare transaction based on output token type
        const rewardRouter = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            abi: RewardRouter,
            publicClient,
        });

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

        return toResult(
            JSON.stringify({
                success: true,
                hash: result.data[0].hash,
                details: {
                    amount,
                    tokenOut,
                    minOut: minOutInTokenWei.toString(),
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
