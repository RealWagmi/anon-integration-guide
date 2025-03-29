import { Address, getContract, encodeFunctionData, parseUnits, formatUnits, decodeEventLog } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { SupportedToken, getTokenAddress } from '../../utils.js';

interface Props {
    chainName: string;
    account: Address;
    tokenSymbol: SupportedToken;
    amount?: string;
    percentOfBalance?: number;
    minUsdg?: string;
    minGlp?: string;
}

/**
 * Adds liquidity to the protocol by providing tokens and receiving ALP in return
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to add liquidity for
 * @param props.tokenSymbol - Symbol of the token to provide as liquidity
 * @param props.amount - Optional exact amount of tokens to provide
 * @param props.percentOfBalance - Optional percentage of token balance to use (1-100)
 * @param props.minUsdg - Optional minimum USDG to receive (default: 0)
 * @param props.minGlp - Optional minimum ALP to receive (default: 0)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    { chainName, account, tokenSymbol, amount, percentOfBalance, minUsdg = '0', minGlp = '0' }: Props,
    options: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    if (chainName !== NETWORKS.SONIC) {
        return toResult(`Protocol is only supported on Sonic chain`, true);
    }

    // Validate input parameters
    if (!amount && !percentOfBalance) {
        return toResult('Either amount or percentOfBalance must be provided', true);
    }

    if (amount && percentOfBalance) {
        return toResult('Cannot specify both amount and percentOfBalance. Please provide only one.', true);
    }

    // Validate amount format if provided
    if (amount) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return toResult('Amount must be a valid number greater than zero', true);
        }
    }

    // Validate percentage if provided
    if (percentOfBalance) {
        if (percentOfBalance <= 0 || percentOfBalance > 100) {
            return toResult('Percentage must be between 1 and 100', true);
        }
    }

    try {
        const provider = options.evm.getProvider(146); // Sonic chain ID

        // Get user's token balance and info
        const userBalanceResult = await getUserTokenBalances({ chainName, account }, options);

        if (!userBalanceResult.success || !userBalanceResult.data) {
            return userBalanceResult;
        }

        const balanceData = JSON.parse(userBalanceResult.data);
        const tokenInfo = balanceData.tokens.find((t: any) => t.symbol === tokenSymbol);

        if (!tokenInfo) {
            return toResult(`Token ${tokenSymbol} not found in user's balance`, true);
        }

        // Calculate amount to add based on percentage if needed
        let amountToAdd: string;
        if (percentOfBalance) {
            const balance = Number(tokenInfo.balance);
            if (balance <= 0) {
                return toResult(`Insufficient ${tokenSymbol} balance`, true);
            }
            amountToAdd = (balance * (percentOfBalance / 100)).toString();
        } else {
            amountToAdd = amount!;
        }

        // Convert amount to contract units
        const decimals = Number(tokenInfo.decimals);
        const amountInWei = parseUnits(amountToAdd, decimals);

        // Check if user has enough balance
        const userBalance = BigInt(tokenInfo.balance);
        if (userBalance < amountInWei) {
            return toResult(
                `Insufficient ${tokenSymbol} balance. Required: ${amountToAdd}, Available: ${formatUnits(userBalance, decimals)}`,
                true
            );
        }

        // Get current pool liquidity for price impact check
        const poolLiquidityResult = await getPoolLiquidity({ chainName }, options);

        if (!poolLiquidityResult.success || !poolLiquidityResult.data) {
            return poolLiquidityResult;
        }

        const poolData = JSON.parse(poolLiquidityResult.data);
        const tokenLiquidity = poolData.tokens.find((t: any) => t.symbol === tokenSymbol);

        if (!tokenLiquidity) {
            return toResult(`No liquidity data found for ${tokenSymbol}`, true);
        }

        // Check price impact
        const poolAmount = safeToNumber(tokenLiquidity.poolAmount);
        if (poolAmount > 0) {
            const priceImpact = (safeToNumber(amountToAdd) / poolAmount) * 100;
            if (priceImpact > 10) {
                return toResult(
                    `Amount too large - would cause significant price impact (${priceImpact.toFixed(2)}%). Consider reducing the amount or splitting into multiple transactions.`,
                    true
                );
            }
        }

        // Prepare transactions
        const transactions = [];
        const tokenIn = getTokenAddress(tokenSymbol);
        const isNativeToken = tokenSymbol === 'S';

        // Add approval transaction if needed
        if (!isNativeToken) {
            const allowance = await provider.readContract({
                address: tokenIn,
                abi: ERC20,
                functionName: 'allowance',
                args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER],
            }) as bigint;

            if (allowance < amountInWei) {
                transactions.push({
                    target: tokenIn,
                    data: encodeFunctionData({
                        abi: ERC20,
                        functionName: 'approve',
                        args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER, amountInWei],
                    }),
                });
            }
        }

        // Add mint transaction
        let mintData: `0x${string}`;
        if (isNativeToken) {
            mintData = encodeFunctionData({
                abi: RewardRouter,
                functionName: 'mintAndStakeGlpETH',
                args: [parseUnits(minUsdg, 18), parseUnits(minGlp, 18)]
            });
        } else {
            mintData = encodeFunctionData({
                abi: RewardRouter,
                functionName: 'mintAndStakeGlp',
                args: [tokenIn, amountInWei, parseUnits(minUsdg, 18), parseUnits(minGlp, 18)]
            });
        }

        transactions.push({
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            data: mintData,
            value: isNativeToken ? amountInWei : undefined,
        });

        // Send transactions
        const result = await options.evm.sendTransactions({
            chainId: 146,
            account,
            transactions,
        });

        if (!result.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        // Wait for transaction to be mined
        await options.notify('Waiting for transaction to be mined...');
        const receipt = await provider.waitForTransactionReceipt({ 
            hash: result.data[0].hash,
            timeout: 60_000, // 60 seconds timeout
        });

        const addLiquidityEvents = receipt.logs.filter(log => {
            const logAddress = safeToString(log?.address).toLowerCase();
            const targetAddress = safeToString(CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER).toLowerCase();
            return logAddress === targetAddress &&
                   log?.topics?.[0] === '0x2c76ed4ddb0c8a6e4c6f8f266e08ee5b5f4b9a5e0e8f591b6eec14e821b7f1ac'; // keccak256('AddLiquidity(address,address,uint256,uint256,uint256,uint256,uint256)')
        });

        if (addLiquidityEvents.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        tokenSymbol,
                        amount: amountToAdd,
                        minUsdg,
                        minGlp,
                        warning: 'Could not parse AddLiquidity event from transaction receipt'
                    },
                }),
            );
        }

        // Parse the event data
        const eventData = addLiquidityEvents[0];
        if (!eventData?.data || !eventData?.topics) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        tokenSymbol,
                        amount: amountToAdd,
                        minUsdg,
                        minGlp,
                        warning: 'Invalid event data structure'
                    },
                }),
            );
        }

        const decodedEvent = decodeEventLog({
            abi: [{
                anonymous: false,
                inputs: [
                    { indexed: false, name: 'account', type: 'address' },
                    { indexed: false, name: 'token', type: 'address' },
                    { indexed: false, name: 'amount', type: 'uint256' },
                    { indexed: false, name: 'aumInUsdg', type: 'uint256' },
                    { indexed: false, name: 'glpSupply', type: 'uint256' },
                    { indexed: false, name: 'usdgAmount', type: 'uint256' },
                    { indexed: false, name: 'mintAmount', type: 'uint256' }
                ],
                name: 'AddLiquidity',
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
                    tokenSymbol,
                    amount: amountToAdd,
                    minUsdg,
                    minGlp,
                    aumInUsdg: formatUnits(decodedEvent.args.aumInUsdg || 0n, 18),
                    glpSupply: formatUnits(decodedEvent.args.glpSupply || 0n, 18),
                    usdgAmount: formatUnits(decodedEvent.args.usdgAmount || 0n, 18),
                    mintAmount: formatUnits(decodedEvent.args.mintAmount || 0n, 18),
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

// Helper function for safe string conversion
function safeToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

// Helper function for safe number conversion
function safeToNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'bigint') {
        try {
            return Number(value);
        } catch {
            return 0;
        }
    }
    return 0;
}
