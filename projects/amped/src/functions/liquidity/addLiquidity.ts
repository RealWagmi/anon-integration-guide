import { parseUnits, formatUnits, decodeEventLog, type TransactionReceipt } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, SupportedNetwork, CHAIN_CONFIG } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.ts';
import { GlpManager } from '../../abis/GlpManager.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { SupportedToken, getTokenAddress, getChainFromName } from '../../utils.js';
import type { PublicClient, WalletClient } from 'viem';
import { encodeFunctionData, Address } from 'viem';
import { Router } from '../../abis/Router.js';
import { Vault } from '../../abis/Vault.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { TokenSymbol, getTokenDecimals } from '../../utils/tokens.js';

// Define the specific chain name type
type SupportedChainName = keyof typeof NETWORKS;

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    tokenSymbol: TokenSymbol;
    amount: string;
    slippageTolerance?: number;
    percentOfBalance?: number;
    minUsdg?: string;
    minGlp?: string;
    publicClient?: any;
    walletClient?: any;
}

/**
 * Adds liquidity to the protocol by providing tokens and receiving ALP in return
 * This implementation uses ethers.js for sending transactions to handle RPC limitations
 *
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address to add liquidity for
 * @param props.tokenSymbol - Symbol of the token to provide as liquidity
 * @param props.amount - Optional exact amount of tokens to provide
 * @param props.slippageTolerance - Optional slippage tolerance percentage
 * @param props.percentOfBalance - Optional percentage of token balance to use (1-100)
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
    const { notify } = options;

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
        const networkContracts = CONTRACT_ADDRESSES[networkName];

        if (!networkContracts) {
            return toResult(`No contract addresses found for chain: ${chainName}`, true);
        }

        // Get token-specific information
        const tokenAddress = getTokenAddress(tokenSymbol, networkName);
        const tokenDecimals = getTokenDecimals(tokenSymbol);
        const isNativeToken = tokenSymbol === 'S' || tokenSymbol === 'ETH';
        
        let amountBigInt: bigint;
        
        try {
            amountBigInt = parseUnits(amount, tokenDecimals);
        } catch (error) {
            return toResult(`Invalid amount format: ${error.message}`, true);
        }

        // Validate input parameters
        if (!amount && !percentOfBalance) {
            return toResult('Either amount or percentOfBalance must be provided', true);
        }

        if (amount && percentOfBalance) {
            return toResult('Cannot specify both amount and percentOfBalance. Please provide only one.', true);
        }

        // Validate percentage if provided
        if (percentOfBalance) {
            if (percentOfBalance <= 0 || percentOfBalance > 100) {
                return toResult('Percentage must be between 1 and 100', true);
            }
        }

        await notify(`Adding liquidity with ${tokenSymbol} on ${networkName}...`);
        
        // Get user token balances
        const userBalanceResult = await getUserTokenBalances({ 
            chainName: networkName as ('sonic' | 'base'), 
            account, 
            publicClient 
        }, options);
        
        if (!userBalanceResult.success || !userBalanceResult.data) {
            await notify(`Failed to get user balances: ${userBalanceResult.data}`);
            return userBalanceResult;
        }

        const balanceData = JSON.parse(userBalanceResult.data);
        const tokenInfo = balanceData.tokens.find((t: any) => t.symbol === tokenSymbol);

        if (!tokenInfo) {
            return toResult(`Token ${tokenSymbol} not found in user's balance`, true);
        }
        await notify(`User ${tokenSymbol} balance: ${tokenInfo.balance}`);

        // Calculate amount to add
        let numericAmountToAdd: number;
        if (percentOfBalance) {
            const balance = Number(tokenInfo.balance);
            await notify(`Raw balance: ${balance}`);
            
            if (balance <= 0) {
                return toResult(`Insufficient ${tokenSymbol} balance (calculated from percentage)`, true);
            }
            numericAmountToAdd = balance * (percentOfBalance / 100);
            await notify(`Using ${percentOfBalance}% of balance: ${numericAmountToAdd} ${tokenSymbol} (calculation: ${balance} * ${percentOfBalance/100} = ${numericAmountToAdd})`);
        } else {
            // amount comes from props, could be string | number at runtime.
            // Ensure it's a valid number.
            const parsedAmount = Number(amount);
            if (isNaN(parsedAmount)) {
                return toResult(`Invalid amount format: ${amount}. Amount must be a valid number.`, true);
            }
            numericAmountToAdd = parsedAmount;
        }

        // Convert the numeric amount to string for display and contract interaction
        const amountToAddString = numericAmountToAdd.toString();
        await notify(`Amount to add (as string): ${amountToAddString}`);

        // Convert amount to contract units
        const amountInWei = parseUnits(amountToAddString, tokenDecimals); // Use string version
        await notify(`Amount in wei: ${amountInWei.toString()}`);

        // Check balance again with wei amount
        const userBalanceWei = parseUnits(tokenInfo.balance, tokenDecimals);
        if (userBalanceWei < amountInWei) {
            return toResult(
                // Use string version for message
                `Insufficient ${tokenSymbol} balance. Required: ${amountToAddString}, Available: ${tokenInfo.balance}`,
                true
            );
        }

        // Get pool liquidity (optional)
        const poolLiquidityResult = await getPoolLiquidity({ 
            chainName: networkName as ('sonic' | 'base'), 
            publicClient 
        } as any, options);
        
        if (!poolLiquidityResult.success || !poolLiquidityResult.data) {
            await notify(`Failed to get pool liquidity: ${poolLiquidityResult.data}`);
            // Continue anyway, this is not critical
        } else {
            const liquidityData = JSON.parse(poolLiquidityResult.data);
            await notify(`Current ALP price: $${liquidityData.glpPrice}`);
        }

        if (!tokenAddress && tokenSymbol !== 'S' && tokenSymbol !== 'ETH') {
            return toResult(`Token ${tokenSymbol} not found on ${networkName}`, true);
        }

        let approvalHash: `0x${string}` | undefined;

        // --- Approve Transaction (for ERC20 tokens only) ---
        if (!isNativeToken) {
            const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
            if (!tokenInAddress) {
                return toResult(`Token address for ${tokenSymbol} not found`, true);
            }

            const glpManagerAddressTyped = networkContracts.GLP_MANAGER as Address;
            if (!glpManagerAddressTyped) {
                return toResult(`GlpManager address not found for network ${networkName}`, true);
            }

            await notify(`Checking ${tokenSymbol} allowance for GlpManager...`);
            // Use viem publicClient to check allowance for GlpManager
            const allowance = await publicClient.readContract({
                address: tokenInAddress as `0x${string}`,
                abi: ERC20,
                functionName: 'allowance',
                args: [account, glpManagerAddressTyped],
            });
            
            if (allowance < amountInWei) {
                await notify(`Allowance is ${formatUnits(allowance, tokenDecimals)}, needs ${formatUnits(amountInWei, tokenDecimals)}. Requesting approval for GlpManager...`);
                try {
                    // Send approval with viem walletClient
                    const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
                    await notify(`Setting unlimited approval (MAX_UINT256) for ${tokenSymbol} for GlpManager`);

                    await notify('Sending approval transaction with viem...');
                    approvalHash = await walletClient.writeContract({
                        address: tokenInAddress as `0x${string}`,
                        abi: ERC20,
                        functionName: 'approve',
                        args: [glpManagerAddressTyped, MAX_UINT256],
                        account: walletClient.account,
                        chain: walletClient.chain,
                    });
                    
                    await notify(`Approval transaction sent: ${approvalHash}. Waiting for confirmation...`);
                    // Wait for receipt with viem publicClient
                    const receipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
                    
                    if (receipt.status === 'success') {
                        await notify('Approval confirmed.');
                        // Verify allowance after approval
                        const newAllowance = await publicClient.readContract({
                            address: tokenInAddress as `0x${string}`,
                            abi: ERC20,
                            functionName: 'allowance',
                            args: [account, glpManagerAddressTyped],
                        });
                        await notify(`New allowance for GlpManager: ${formatUnits(newAllowance, tokenDecimals)} ${tokenSymbol}`);
                        if (newAllowance < amountInWei) {
                            return toResult(`Approval transaction successful but allowance for GlpManager is still insufficient. Required: ${formatUnits(amountInWei, tokenDecimals)}, Granted: ${formatUnits(newAllowance, tokenDecimals)}`, true);
                        }
                    } else {
                        throw new Error(`Approval transaction failed: ${approvalHash} (Status: ${receipt.status})`);
                    }
                } catch (e: any) {
                    await notify(`ERROR: Approval failed: ${e.message}`);
                    console.error("Approval Error:", e);
                    return toResult(`Approval failed: ${e.message}`, true);
                }
            } else {
                await notify(`Sufficient allowance already granted to GlpManager: ${formatUnits(allowance, tokenDecimals)} ${tokenSymbol}`);
            }
        }

        // --- Mint Transaction ---
        await notify('Preparing mint transaction...');
        
        const rewardRouterAddressTyped = networkContracts.REWARD_ROUTER as Address;
        if (!rewardRouterAddressTyped) {
            return toResult(`RewardRouter address not found for network ${networkName}`, true);
        }

        const parsedMinUsdg = parseUnits(minUsdg, 18);
        const parsedMinGlp = parseUnits(minGlp, 18);

        let mintTxHash: `0x${string}` | undefined;
        let mintReceipt: TransactionReceipt | undefined;
        try {
            if (isNativeToken) {
                // Native token mint with viem
                await notify('Sending native token mint transaction with viem...');
                mintTxHash = await walletClient.writeContract({
                    address: rewardRouterAddressTyped,
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlpETH',
                    args: [parsedMinUsdg, parsedMinGlp],
                    value: amountInWei, // Pass value for native token
                    account: walletClient.account,
                    chain: walletClient.chain,
                });
            } else {
                // ERC20 token mint with viem
                const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
                if (!tokenInAddress) {
                    return toResult(`Token address for ${tokenSymbol} not found on ${networkName}`, true);
                }
                
                await notify('Sending ERC20 token mint transaction with viem...');
                mintTxHash = await walletClient.writeContract({
                    address: rewardRouterAddressTyped,
                    abi: RewardRouter,
                    functionName: 'mintAndStakeGlp',
                    args: [tokenInAddress as `0x${string}`, amountInWei, parsedMinUsdg, parsedMinGlp],
                    account: walletClient.account,
                    chain: walletClient.chain,
                });
            }
            
            await notify(`Mint transaction sent: ${mintTxHash}`);
            
            // Wait for receipt with viem
            await notify('Waiting for transaction confirmation...');
            mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
            
            if (mintReceipt && mintReceipt.status === 'success') {
                await notify(`Mint transaction confirmed: ${mintTxHash}`);
            } else {
                throw new Error(`Mint transaction failed: ${mintTxHash} (Status: ${mintReceipt?.status})`);
            }
            
            // Parse event from receipt using viem
            let alpReceived = 'N/A';
            if (mintReceipt && mintReceipt.logs) {
                // Check logs from RewardRouter address
                const rewardRouterAddressLower = rewardRouterAddressTyped.toLowerCase(); 
                for (const log of mintReceipt.logs) {
                    // Check if the log address matches the RewardRouter address
                    if (log.address.toLowerCase() === rewardRouterAddressLower) {
                        try {
                            const decodedEvent = decodeEventLog({
                                abi: RewardRouter, // Use the RewardRouter ABI
                                data: log.data,
                                topics: log.topics,
                            });

                            // Check if it's the StakeGlp event and extract amount
                            if (decodedEvent.eventName === 'StakeGlp') {
                                // amount is the 2nd value in the event args array (index 1)
                                if (Array.isArray(decodedEvent.args) && decodedEvent.args.length >= 2) { 
                                    // @ts-ignore - Expecting bigint
                                    const mintAmount = decodedEvent.args[1]; // Get amount from index 1
                                    if (typeof mintAmount === 'bigint') {
                                        alpReceived = formatUnits(mintAmount, 18);
                                        await notify(`ALP received (from StakeGlp event): ${alpReceived}`);
                                        break; // Found the event, exit loop
                                    }
                                }
                            }
                        } catch (decodeError: any) {
                            // Ignore logs that don't match the RewardRouter ABI or StakeGlp event
                            if (!(decodeError.name === 'DecodeLogTopicsMismatch' || decodeError.name === 'DecodeLogDataMismatch')) {
                                await notify(`Warning: Could not decode a potential RewardRouter event - ${decodeError.message}`);
                                console.warn("Event Decode Error:", decodeError);
                            }
                        }
                    }
                }
            }
            
            if (alpReceived === 'N/A') {
                await notify('Warning: StakeGlp event log not found or not parsed from RewardRouter.');
            }
            
            return toResult(
                JSON.stringify({
                    success: true,
                    transactionHash: mintTxHash,
                    approvalHash: approvalHash,
                    details: {
                        tokenSymbol,
                        amountAdded: amountToAddString,
                        alpReceived: alpReceived,
                        minUsdgSet: minUsdg,
                        minGlpSet: minGlp,
                    },
                }),
            );
            
        } catch (e: any) {
            await notify(`Mint transaction failed: ${e.message}`);
            console.error("Mint Error:", e);
            return toResult(`Mint failed: ${e.message}`, true); 
        }
    } catch (error: any) {
        await notify(`Error adding liquidity: ${error.message}`);
        console.error("Add Liquidity Error:", error);
        return toResult(`Failed to add liquidity: ${error.message}`, true);
    }
} 