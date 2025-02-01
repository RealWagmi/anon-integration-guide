import { Address, getContract, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';

interface AddLiquidityProps {
    chainName: typeof NETWORKS[keyof typeof NETWORKS];
    account: Address;
    tokenIn: Address;
    amount: string;
}

/**
 * Add liquidity to the Amped Finance protocol by providing tokens in exchange for GLP
 * @param props - The liquidity addition parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account providing liquidity
 * @param props.tokenIn - Address of the token to provide as liquidity
 * @param props.amount - Amount of tokens to provide as liquidity
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    { chainName, account, tokenIn, amount }: AddLiquidityProps,
    { getProvider, notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    try {
        await notify('Checking token balances...');

        // Check user's token balance first
        const userBalanceResult = await getUserTokenBalances(
            { chainName, account },
            { 
                getProvider, 
                notify,
                sendTransactions: async () => { throw new Error('Should not be called'); }
            }
        );

        if (!userBalanceResult.success) {
            return userBalanceResult;
        }

        const balanceData = JSON.parse(userBalanceResult.data);
        const tokenInfo = balanceData.tokens.find((t: any) => 
            t.address.toLowerCase() === tokenIn.toLowerCase()
        );

        if (!tokenInfo) {
            return toResult(`Token ${tokenIn} not found in supported tokens`, true);
        }

        // Parse amounts using the correct decimals
        const parsedAmount = parseUnits(amount, tokenInfo.decimals);
        const userBalance = BigInt(tokenInfo.balance);

        // Check if user has enough balance
        if (userBalance < parsedAmount) {
            const formattedBalance = Number(userBalance) / Math.pow(10, tokenInfo.decimals);
            return toResult(
                `Insufficient ${tokenInfo.symbol} balance. Required: ${amount}, Available: ${formattedBalance.toFixed(tokenInfo.decimals === 6 ? 6 : 18)} ${tokenInfo.symbol}`,
                true
            );
        }

        await notify('Preparing to add liquidity...');
        const provider = getProvider(146); // Sonic chain ID

        // Initialize contracts
        const rewardRouter = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            abi: RewardRouter,
            client: provider
        });

        const glpManager = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
            abi: GlpManager,
            client: provider
        });

        // Check token approval if not native token
        if (tokenIn !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
            await notify('Checking token approval...');
            
            const tokenContract = getContract({
                address: tokenIn,
                abi: ERC20,
                client: provider
            });

            // Check current allowance
            const allowance = await tokenContract.read.allowance([
                account,
                CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER
            ]);

            if (allowance < parsedAmount) {
                await notify('Approval needed. Please approve the transaction...');
                const approvalTx = await sendTransactions({
                    chainId: 146,
                    account,
                    transactions: [{
                        target: tokenIn,
                        data: encodeFunctionData({
                            abi: ERC20,
                            functionName: 'approve',
                            args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER, parsedAmount]
                        })
                    }]
                });

                if (!approvalTx.data?.[0]?.hash) {
                    return toResult('Failed to approve token', true);
                }
            }
        }

        await notify('Preparing transaction...');

        // Prepare transaction data
        const txData: TransactionParams = {
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
            value: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? parsedAmount : 0n,
            data: encodeFunctionData({
                abi: RewardRouter,
                functionName: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? 'mintAndStakeGlpETH' : 'mintAndStakeGlp',
                args: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN 
                    ? [0n, 0n] // minUsdg and minGlp for ETH
                    : [tokenIn, parsedAmount, 0n, 0n] // token, amount, minUsdg, minGlp for other tokens
            })
        };

        // Send transaction
        await notify('Executing transaction...');
        const txResult = await sendTransactions({
            chainId: 146,
            account,
            transactions: [txData]
        });

        if (!txResult.data?.[0]?.hash) {
            return toResult('Transaction failed', true);
        }

        return toResult(JSON.stringify({
            success: true,
            transactionHash: txResult.data[0].hash,
            details: {
                tokenIn,
                amount: parsedAmount.toString(),
                tokenSymbol: tokenInfo.symbol
            }
        }));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to add liquidity: ${error.message}`, true);
        }
        return toResult('Failed to add liquidity: Unknown error', true);
    }
}