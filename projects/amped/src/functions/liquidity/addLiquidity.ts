import { parseUnits, formatUnits, decodeEventLog, type TransactionReceipt, type Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.ts';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { getTokenAddress, getChainFromName } from '../../utils.js';
import { TokenSymbol, getTokenDecimals } from '../../utils/tokens.js';

interface Props {
    chainName: string;
    account: Address;
    tokenSymbol: TokenSymbol;
    amount: string | null;
    slippageTolerance?: number;
    percentOfBalance: number | null;
    minUsdg?: string;
    minGlp?: string;
    publicClient?: any;
    walletClient?: any;
}

/**
 * Adds liquidity to the protocol by providing tokens and receiving ALP in return
 *
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address to add liquidity for
 * @param props.tokenSymbol - Symbol of the token to provide as liquidity
 * @param props.amount - Exact amount of tokens to provide (null if using percentOfBalance)
 * @param props.slippageTolerance - Optional slippage tolerance percentage
 * @param props.percentOfBalance - Percentage of token balance to use (1-100) (null if using amount)
 * @param props.minUsdg - Optional minimum USDG to receive (default: 0)
 * @param props.minGlp - Optional minimum ALP to receive (default: 0)
 * @param props.publicClient - Optional Viem Public Client for interacting with the blockchain
 * @param props.walletClient - Optional Viem Wallet Client for interacting with the blockchain
 * @param options - System tools (notify)
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    { chainName, account, tokenSymbol, amount, slippageTolerance = 0.5, percentOfBalance, minUsdg = '0', minGlp = '0', publicClient, walletClient }: Props,
    options: FunctionOptions
): Promise<FunctionReturn> {
    const { notify, evm: { sendTransactions } } = options;
    const { checkToApprove } = EVM.utils;

    // Check wallet connection
    if (!account) {
        return toResult('Wallet not connected', true);
    }

    try {
        const chainId = getChainFromName(chainName);
        if (!chainId) {
            return toResult(`Chain not supported: ${chainName}`, true);
        }

        const networkName = chainName.toLowerCase();
        const networkContracts = CONTRACT_ADDRESSES[chainId];

        // Get token-specific information
        const tokenAddress = getTokenAddress(tokenSymbol, networkName);
        const tokenDecimals = getTokenDecimals(tokenSymbol);
        const isNativeToken = tokenSymbol === 'S' || tokenSymbol === 'ETH';
        
        // Validate input parameters - must provide either amount or percentOfBalance
        if (percentOfBalance && amount) {
            return toResult('Cannot provide both amount and percentOfBalance', true);
        }
        
        if (!percentOfBalance && (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0)) {
            return toResult('Must provide either a valid amount greater than 0 or percentOfBalance', true);
        }
        
        if (percentOfBalance && (percentOfBalance <= 0 || percentOfBalance > 100)) {
            return toResult('Percentage must be between 1 and 100', true);
        }

        await notify(`Adding liquidity with ${tokenSymbol}...`);
        
        // Get user token balance directly
        let userBalance: bigint;
        let userBalanceFormatted: string;
        
        if (isNativeToken) {
            // For native tokens, get the balance directly
            userBalance = await publicClient.getBalance({ address: account });
            userBalanceFormatted = formatUnits(userBalance, tokenDecimals);
        } else {
            // For ERC20 tokens, read the balance from the contract
            const tokenContractAddress = tokenAddress as `0x${string}`;
            if (!tokenContractAddress) {
                return toResult(`Token address for ${tokenSymbol} not found`, true);
            }
            
            userBalance = await publicClient.readContract({
                address: tokenContractAddress,
                abi: ERC20,
                functionName: 'balanceOf',
                args: [account],
            }) as bigint;
            userBalanceFormatted = formatUnits(userBalance, tokenDecimals);
        }
        
        // Calculate amount to add
        let numericAmountToAdd: number;
        if (percentOfBalance) {
            const balance = Number(userBalanceFormatted);
            if (balance <= 0) {
                return toResult(`Insufficient ${tokenSymbol} balance (calculated from percentage)`, true);
            }
            numericAmountToAdd = balance * (percentOfBalance / 100);
        } else {
            // amount is guaranteed to be a valid string from validation above
            numericAmountToAdd = Number(amount);
        }

        // Convert the numeric amount to string for display and contract interaction
        const amountToAddString = numericAmountToAdd.toString();
        // Convert amount to contract units
        const amountInWei = parseUnits(amountToAddString, tokenDecimals);

        // Check balance again with wei amount
        if (userBalance < amountInWei) {
            return toResult(
                // Use string version for message
                `Insufficient ${tokenSymbol} balance. Required: ${amountToAddString}, Available: ${userBalanceFormatted}`,
                true
            );
        }

        // Get pool liquidity to check capacity
        let estimatedImpact = "0.00%";
        const poolLiquidityResult = await getPoolLiquidity({ 
            chainName: networkName as ('sonic' | 'base'), 
            publicClient 
        } as any, options);
        
        if (poolLiquidityResult.success && poolLiquidityResult.data) {
            try {
                const poolData = JSON.parse(poolLiquidityResult.data);
                
                // Find the token we're trying to deposit
                const tokenData = poolData.tokens.find((t: any) => t.symbol === tokenSymbol);
                
                if (tokenData && tokenData.depositCapacity) {
                    // Check if deposits are allowed
                    if (!tokenData.depositCapacity.canDeposit) {
                        return toResult(
                            `Cannot add liquidity: ${tokenSymbol} pool is over-utilized (${tokenData.depositCapacity.utilizationPercent}% utilized)`,
                            true
                        );
                    }
                    
                    // Check if deposit amount exceeds theoretical max
                    const theoreticalMaxAmount = parseFloat(tokenData.depositCapacity.theoreticalMax);
                    if (numericAmountToAdd > theoreticalMaxAmount) {
                        return toResult(
                            `Deposit amount (${amountToAddString}) exceeds maximum allowed (${theoreticalMaxAmount.toFixed(6)} ${tokenSymbol})`,
                            true
                        );
                    }
                    
                    // Calculate and warn about price impact
                    const depositValueUsd = numericAmountToAdd * parseFloat(tokenData.price);
                    
                    if (depositValueUsd < 5000) {
                        estimatedImpact = tokenData.depositCapacity.priceImpactEstimates.small;
                    } else if (depositValueUsd < 50000) {
                        estimatedImpact = tokenData.depositCapacity.priceImpactEstimates.medium;
                    } else {
                        estimatedImpact = tokenData.depositCapacity.priceImpactEstimates.large;
                    }
                    
                    // Warn if price impact is significant
                    const impactValue = parseFloat(estimatedImpact);
                    if (impactValue > 1) {
                        await notify(`⚠️ Warning: Estimated price impact of ${estimatedImpact} for this deposit`);
                    }
                    
                    // Log pool utilization info
                    await notify(`Pool utilization for ${tokenSymbol}: ${tokenData.depositCapacity.utilizationPercent}%`);
                }
            } catch (e) {
                // If parsing fails, continue anyway
                await notify(`Could not parse pool liquidity data, continuing...`);
            }
        }

        if (!tokenAddress && tokenSymbol !== 'S' && tokenSymbol !== 'ETH') {
            return toResult(`Token ${tokenSymbol} not found on ${networkName}`, true);
        }

        // Prepare transactions array
        const transactions: EVM.types.TransactionParams[] = [];

        // --- Handle Approval for ERC20 tokens ---
        if (!isNativeToken) {
            const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
            if (!tokenInAddress) {
                return toResult(`Token address for ${tokenSymbol} not found`, true);
            }

            const glpManagerAddressTyped = networkContracts.GLP_MANAGER as Address;

            // Use SDK's checkToApprove utility
            await checkToApprove({
                args: {
                    account,
                    target: tokenInAddress as Address,
                    spender: glpManagerAddressTyped,
                    amount: amountInWei,
                },
                provider: publicClient,
                transactions,
            });
            
        }

        // --- Mint Transaction ---
        
        const rewardRouterAddressTyped = networkContracts.REWARD_ROUTER as Address;

        const parsedMinUsdg = parseUnits(minUsdg, 18);
        const parsedMinGlp = parseUnits(minGlp, 18);

        // Prepare mint transaction
        let mintTx: EVM.types.TransactionParams;
        
        if (isNativeToken) {
            // Native token mint
            mintTx = {
                target: rewardRouterAddressTyped,
                data: encodeFunctionData({
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlpETH',
                    args: [parsedMinUsdg, parsedMinGlp],
                }),
                value: amountInWei.toString(), // Pass value for native token
            };
        } else {
            // ERC20 token mint
            const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
            if (!tokenInAddress) {
                return toResult(`Token address for ${tokenSymbol} not found on ${networkName}`, true);
            }
            
            mintTx = {
                target: rewardRouterAddressTyped,
                data: encodeFunctionData({
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlp',
                    args: [tokenInAddress as `0x${string}`, amountInWei, parsedMinUsdg, parsedMinGlp],
                }),
            };
        }
        
        transactions.push(mintTx);
        
        // Send all transactions
        try {
            await notify(`Sending ${transactions.length} transaction(s)...`);
            const txResult = await sendTransactions({
                chainId,
                from: account,
                transactions,  // Changed from params to transactions
            });
            
            if (!txResult.success) {
                throw new Error(txResult.error || 'Transaction failed');
            }
            
            // Parse the result to get transaction details
            let transactionHash: string | undefined;
            let alpReceived = 'N/A';
            
            // Handle different response formats
            if (txResult.data) {
                // Check if data is array (direct tx responses) or object with results
                if (Array.isArray(txResult.data) && txResult.data.length > 0) {
                    // Direct transaction response format from our sendTransactions
                    const lastTx = txResult.data[txResult.data.length - 1];
                    transactionHash = lastTx.hash;
                    
                    // Wait for receipt to get events
                    if (lastTx.wait) {
                        try {
                            const receipt = await lastTx.wait();
                            await notify(`Transaction completed with status: ${receipt.status}`);
                            
                            // TODO: Parse receipt logs to get ALP amount
                            // For now, just indicate success
                            if (receipt.status === 'success') {
                                alpReceived = 'Check transaction for details';
                            }
                        } catch (e) {
                            await notify(`Warning: Could not get transaction receipt`);
                        }
                    }
                } else if (typeof txResult.data === 'object' && txResult.data.results) {
                    // SDK format with results array
                    const results = txResult.data.results;
                    if (results.length > 0) {
                        const lastTx = results[results.length - 1];
                        transactionHash = lastTx.transactionHash;
                        
                        // Try to extract ALP received from events
                        if (lastTx.events) {
                            for (const event of lastTx.events) {
                                if (event.eventName === 'StakeGlp' && event.args) {
                                    // amount is typically the second argument
                                    const mintAmount = event.args[1];
                                    if (mintAmount) {
                                        alpReceived = formatUnits(BigInt(mintAmount), 18);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Include capacity check results in response
            let capacityInfo = {};
            if (poolLiquidityResult.success && poolLiquidityResult.data) {
                try {
                    const poolData = JSON.parse(poolLiquidityResult.data);
                    const tokenData = poolData.tokens.find((t: any) => t.symbol === tokenSymbol);
                    if (tokenData && tokenData.depositCapacity) {
                        capacityInfo = {
                            poolUtilization: tokenData.depositCapacity.utilizationPercent + "%",
                            estimatedPriceImpact: estimatedImpact || "N/A",
                        };
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
            
            return toResult(
                JSON.stringify({
                    success: true,
                    transactionHash,
                    details: {
                        tokenSymbol,
                        amountAdded: amountToAddString,
                        alpReceived: alpReceived,
                        minUsdgSet: minUsdg,
                        minGlpSet: minGlp,
                        transactionCount: transactions.length,
                        ...capacityInfo,
                    },
                }),
            );
            
        } catch (e: any) {
            return toResult(`Failed to add liquidity: ${e.message}`, true); 
        }
    } catch (error: any) {
        return toResult(`Failed to add liquidity: ${error.message}`, true);
    }
} 