import { Address, getContract, encodeFunctionData, parseUnits, formatUnits, decodeEventLog } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';

// Define supported token symbols
export type SupportedToken = 'S' | 'WS' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

interface Props {
    chainName: string;
    account: Address;
    tokenSymbol: SupportedToken;
    amount?: string;
    percentOfBalance?: number;
    minUsdg?: string;
    minGlp?: string;
}

// Helper function to get token address from symbol
function getTokenAddress(symbol: SupportedToken): Address {
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

function getNativeTokenAddress(): Address {
    return CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
}

/**
 * Add liquidity to the Amped Finance protocol by providing tokens in exchange for ALP
 * @param props - The liquidity addition parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account providing liquidity
 * @param props.tokenSymbol - Symbol of the token to provide as liquidity (S, WETH, ANON, USDC, EURC)
 * @param props.amount - Exact amount of tokens to provide as liquidity. Required if percentOfBalance is not provided.
 * @param props.percentOfBalance - Percentage of balance to use (1-100). Required if amount is not provided.
 * @param props.minUsdg - Optional minimum USDG to receive (default: 0)
 * @param props.minGlp - Optional minimum ALP to receive (default: 0)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    { chainName, account, tokenSymbol, amount, percentOfBalance, minUsdg = '0', minGlp = '0' }: Props,
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

    // Validate input parameters
    if (!amount && !percentOfBalance) {
        return toResult('Either amount or percentOfBalance must be provided', true);
    }

    if (amount && percentOfBalance) {
        return toResult('Cannot specify both amount and percentOfBalance. Please provide only one.', true);
    }

    if (percentOfBalance && (percentOfBalance <= 0 || percentOfBalance > 100)) {
        return toResult('Percentage must be between 1 and 100', true);
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
        } else if (percentOfBalance) {
            const balance = Number(formatUnits(BigInt(tokenInfo.balance), tokenInfo.decimals));
            amountToAdd = (balance * (percentOfBalance / 100)).toFixed(tokenInfo.decimals);
        } else {
            // This should never happen due to earlier validation
            return toResult('Internal error: No amount specified', true);
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
        const transactions: TransactionParams[] = [];
        if (tokenIn !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
            await notify('Checking token approval...');

            // Use checkApprove helper to handle token approval
            await checkToApprove({
                args: {
                    account,
                    target: tokenIn,
                    spender: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
                    amount: parsedAmount
                },
                provider,
                transactions
            });

            if (transactions.length > 0) {
                await notify('Token approval needed, adding approval transaction...');
            } else {
                await notify('Token already has sufficient approval.');
            }
        }

        await notify('Preparing transaction...');

        // Parse min amounts
        const parsedMinUsdg = parseUnits(minUsdg, 18);
        const parsedMinGlp = parseUnits(minGlp, 18);

        // Add the main transaction
        transactions.push({
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
        });

        // Send transactions
        await notify('Executing transaction...');
        const txResult = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        if (!txResult.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        // Get transaction receipt and parse AddLiquidity event
        const receipt = await provider.getTransactionReceipt({ hash: txResult.data[0].hash });

        const addLiquidityEvents = receipt.logs.filter(log => {
            return log.address.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER.toLowerCase() &&
                   log.topics[0] === '0x2c76ed4ddb0c8a6e4c6f8f266e08ee5b5f4b9a5e0e8f591b6eec14e821b7f1ac'; // keccak256('AddLiquidity(address,address,uint256,uint256,uint256,uint256,uint256)')
        });

        if (addLiquidityEvents.length === 0) {
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
                        warning: 'Could not parse AddLiquidity event from transaction receipt'
                    },
                }),
            );
        }

        // Parse the event data
        const eventData = addLiquidityEvents[0];
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

        // Verify the event data matches our expectations
        if (decodedEvent.args.account.toLowerCase() !== account.toLowerCase() ||
            decodedEvent.args.token.toLowerCase() !== tokenIn.toLowerCase()) {
            return toResult(
                `Add liquidity event validation failed. Expected account ${account} and token ${tokenIn}, but got account ${decodedEvent.args.account} and token ${decodedEvent.args.token}`,
                true
            );
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
                    // Add event data
                    receivedAlp: formatUnits(decodedEvent.args.mintAmount, 18),
                    aumInUsdg: formatUnits(decodedEvent.args.aumInUsdg, 18),
                    glpSupply: formatUnits(decodedEvent.args.glpSupply, 18),
                    usdgAmount: formatUnits(decodedEvent.args.usdgAmount, 18),
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
