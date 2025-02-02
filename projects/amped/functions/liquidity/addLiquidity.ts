import { Address, getContract, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';

// Define supported token symbols
export type SupportedToken = 'S' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

interface Props {
    chainName: string;
    account: Address;
    tokenSymbol: SupportedToken; // Changed from tokenIn to tokenSymbol
    amount?: string; // Optional: if not provided, will use percentOfBalance
    percentOfBalance?: number; // Optional: used if amount not provided, defaults to 25
    minUsdg?: string;
    minGlp?: string;
}

// Helper function to get token address from symbol
function getTokenAddress(symbol: SupportedToken): Address {
    switch (symbol) {
        case 'S':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
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
 * Add liquidity to the Amped Finance protocol by providing tokens in exchange for ALP
 * @param props - The liquidity addition parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account providing liquidity
 * @param props.tokenSymbol - Symbol of the token to provide as liquidity (S, WETH, ANON, USDC, EURC)
 * @param props.amount - Optional: specific amount to provide as liquidity
 * @param props.percentOfBalance - Optional: percent of balance to use (1-100), defaults to 25 if amount not provided
 * @param props.minUsdg - Optional minimum USDG to receive (default: 0)
 * @param props.minGlp - Optional minimum ALP to receive (default: 0)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    { chainName, account, tokenSymbol, amount, percentOfBalance = 25, minUsdg = '0', minGlp = '0' }: Props,
    { getProvider, notify, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (chainName !== NETWORKS.SONIC) {
        return toResult(`Protocol is only supported on Sonic chain`, true);
    }

    // Validate percentOfBalance if provided
    if (percentOfBalance <= 0 || percentOfBalance > 100) {
        return toResult('Percent of balance must be between 0 and 100', true);
    }

    try {
        // Get token address from symbol
        const tokenIn = getTokenAddress(tokenSymbol);

        await notify('Checking token balances...');

        // Get user's token balance and info
        const userBalanceResult = await getUserTokenBalances({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!userBalanceResult.success) {
            return userBalanceResult;
        }

        const balanceData = JSON.parse(userBalanceResult.data);
        const tokenInfo = balanceData.tokens.find((t: any) => t.address.toLowerCase() === tokenIn.toLowerCase());

        if (!tokenInfo) {
            return toResult(`Token ${tokenSymbol} not found in supported tokens`, true);
        }

        // Calculate amount to add
        let amountToAdd: string;
        if (amount) {
            amountToAdd = amount;
        } else {
            const balance = Number(formatUnits(BigInt(tokenInfo.balance), tokenInfo.decimals));
            amountToAdd = (balance * (percentOfBalance / 100)).toFixed(tokenInfo.decimals);
        }

        // Parse amounts using the correct decimals
        const parsedAmount = parseUnits(amountToAdd, tokenInfo.decimals);
        const userBalance = BigInt(tokenInfo.balance);

        // Check minimum amount (0.0001 for most tokens)
        const minAmount = parseUnits('0.0001', tokenInfo.decimals);
        if (parsedAmount < minAmount) {
            return toResult(`Amount too small. Minimum amount is 0.0001 ${tokenInfo.symbol}. Specified amount: ${amountToAdd} ${tokenInfo.symbol}`, true);
        }

        // Check if user has enough balance
        if (userBalance < parsedAmount) {
            const formattedBalance = formatUnits(userBalance, tokenInfo.decimals);
            return toResult(`Insufficient ${tokenInfo.symbol} balance. Required: ${amountToAdd}, Available: ${formattedBalance} ${tokenInfo.symbol}`, true);
        }

        // Get current pool liquidity for price impact check
        const poolLiquidityResult = await getPoolLiquidity({ chainName }, { getProvider, notify, sendTransactions });

        if (!poolLiquidityResult.success) {
            return poolLiquidityResult;
        }

        const poolData = JSON.parse(poolLiquidityResult.data);
        const tokenValueUsd = Number(tokenInfo.balanceUsd) * (Number(amountToAdd) / Number(formatUnits(userBalance, tokenInfo.decimals)));
        const priceImpact = (tokenValueUsd / Number(poolData.aum)) * 100;

        // Warn if price impact is high
        if (priceImpact > 1) {
            await notify(`Warning: High price impact (${priceImpact.toFixed(2)}%). Consider reducing the amount.`);
        }

        await notify('Preparing to add liquidity...');
        const provider = getProvider(chainId);

        // Check token approval if not native token
        if (tokenIn !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
            await notify('Checking token approval...');

            // Check current allowance for RewardRouterV2
            const allowance = await provider.readContract({
                address: tokenIn,
                abi: ERC20,
                functionName: 'allowance',
                args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER],
            }) as bigint;

            await notify(`Current allowance: ${formatUnits(allowance, tokenInfo.decimals)} ${tokenInfo.symbol}`);

            // If allowance is insufficient, request approval
            if (allowance < parsedAmount) {
                await notify(`Insufficient allowance. Need: ${amountToAdd} ${tokenInfo.symbol}, Have: ${formatUnits(allowance, tokenInfo.decimals)} ${tokenInfo.symbol}`);
                await notify('Requesting approval...');

                // Request approval for a large amount to avoid frequent approvals
                const approvalAmount = parsedAmount * 1000n; // Approve 1000x the amount needed
                const approvalTx = await sendTransactions({
                    chainId,
                    account,
                    transactions: [
                        {
                            target: tokenIn,
                            data: encodeFunctionData({
                                abi: ERC20,
                                functionName: 'approve',
                                args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER, approvalAmount],
                            }),
                        },
                    ],
                });

                if (!approvalTx.data?.[0]?.hash) {
                    return toResult('Failed to approve token', true);
                }

                await notify(`Approval transaction submitted. Waiting for confirmation...`);

                // Wait for approval to be confirmed before proceeding
                await provider.waitForTransactionReceipt({ hash: approvalTx.data[0].hash });

                // Verify the new allowance
                const newAllowance = await provider.readContract({
                    address: tokenIn,
                    abi: ERC20,
                    functionName: 'allowance',
                    args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER],
                }) as bigint;

                if (newAllowance < parsedAmount) {
                    return toResult(
                        `Approval failed. Required: ${amountToAdd} ${tokenInfo.symbol}, Current allowance: ${formatUnits(newAllowance, tokenInfo.decimals)} ${tokenInfo.symbol}`,
                        true,
                    );
                }

                await notify(`Token approved successfully for ${formatUnits(approvalAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`);
            } else {
                await notify('Token already has sufficient approval.');
            }
        }

        await notify('Preparing transaction...');

        // Parse min amounts
        const parsedMinUsdg = parseUnits(minUsdg, 18);
        const parsedMinGlp = parseUnits(minGlp, 18);

        // Prepare transaction data
        const txData: TransactionParams = {
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            value: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? parsedAmount : 0n,
            data: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
                ? encodeFunctionData({
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlpETH',
                    args: [parsedMinUsdg, parsedMinGlp],
                })
                : encodeFunctionData({
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlp',
                    args: [tokenIn, parsedAmount, parsedMinUsdg, parsedMinGlp],
                }),
        };

        // Send transaction
        await notify('Executing transaction...');
        const txResult = await sendTransactions({
            chainId,
            account,
            transactions: [txData],
        });

        if (!txResult.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        return toResult(
            JSON.stringify({
                success: true,
                transactionHash: txResult.data[0].hash,
                details: {
                    token: tokenSymbol,
                    amount: formatUnits(parsedAmount, tokenInfo.decimals),
                    tokenSymbol: tokenInfo.symbol,
                    amountUsd: tokenValueUsd.toFixed(2),
                    minUsdg: formatUnits(parsedMinUsdg, 18),
                    minGlp: formatUnits(parsedMinGlp, 18),
                    priceImpact: priceImpact.toFixed(4),
                },
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to add liquidity: ${error.message}`, true);
        }
        return toResult('Failed to add liquidity: Unknown error', true);
    }
}
