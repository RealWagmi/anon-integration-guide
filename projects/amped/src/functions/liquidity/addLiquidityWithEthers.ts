import { parseUnits, formatUnits } from 'viem';
import { ethers } from 'ethers';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, SupportedNetwork, CHAIN_CONFIG } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { getUserTokenBalances } from './getUserTokenBalances.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { SupportedToken, getTokenAddress, getChainFromName } from '../../utils.js';
import type { PublicClient, WalletClient } from 'viem';

// Define the specific chain name type
type SupportedChainName = keyof typeof NETWORKS;

interface Props {
    chainName: SupportedChainName;
    account: `0x${string}`;
    tokenSymbol: SupportedToken;
    amount?: string;
    percentOfBalance?: number;
    minUsdg?: string;
    minGlp?: string;
    publicClient: PublicClient;
    walletClient: WalletClient;
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
 * @param props.percentOfBalance - Optional percentage of token balance to use (1-100)
 * @param props.minUsdg - Optional minimum USDG to receive (default: 0)
 * @param props.minGlp - Optional minimum ALP to receive (default: 0)
 * @param props.publicClient - Viem Public Client (used for read operations)
 * @param props.walletClient - Viem Wallet Client (contains private key)
 * @param options - System tools (notify)
 * @returns Transaction result with liquidity addition details
 */
export async function addLiquidity(
    props: Props,
    options: FunctionOptions
): Promise<FunctionReturn> {
    const { notify } = options;
    const { 
        chainName, 
        account, 
        tokenSymbol, 
        amount, 
        percentOfBalance, 
        minUsdg = '0', 
        minGlp = '0', 
        publicClient, 
        walletClient
    } = props;

    // Check wallet connection
    if (!account || !walletClient) return toResult('Wallet not connected', true);
    if (!publicClient) return toResult('Public client not available', true);

    // Check if walletClient has an account (which includes signing capabilities)
    if (!walletClient || !walletClient.account) {
        return toResult('Wallet client or account is not configured correctly.', true);
    }

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    
    // networkName is now guaranteed to be 'sonic' or 'base'
    const networkName = chainName.toLowerCase() as SupportedNetwork;
    const networkContracts = CONTRACT_ADDRESSES[networkName];
    const rewardRouterAddress = networkContracts.REWARD_ROUTER;
    const glpManagerAddress = networkContracts.GLP_MANAGER;

    if (!networkContracts || !rewardRouterAddress || !glpManagerAddress) {
        return toResult(`Core contract addresses not found for network: ${networkName}`, true);
    }

    const nativeSymbol = networkName === NETWORKS.SONIC ? 'S' : 'ETH';

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
        await notify(`Adding liquidity with ${tokenSymbol} on ${networkName}...`);
        
        // Set up ethers.js provider and wallet
        await notify('Setting up ethers.js provider and wallet...');
        const rpcUrl = CHAIN_CONFIG[networkName].rpcUrls.default.http[0];
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        // Use the viem account directly with ethers.Wallet
        const wallet = new ethers.Wallet(walletClient.account, provider);
        await notify(`Using ethers.js wallet for account: ${wallet.address}`);
        
        // Get user token balances
        const userBalanceResult = await getUserTokenBalances({ 
            chainName: networkName, 
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
        let amountToAdd: string;
        if (percentOfBalance) {
            const balance = Number(tokenInfo.balance);
            await notify(`Raw balance: ${balance}`);
            
            if (balance <= 0) {
                return toResult(`Insufficient ${tokenSymbol} balance (calculated from percentage)`, true);
            }
            amountToAdd = (balance * (percentOfBalance / 100)).toString();
            await notify(`Using ${percentOfBalance}% of balance: ${amountToAdd} ${tokenSymbol} (calculation: ${balance} * ${percentOfBalance/100} = ${amountToAdd})`);
        } else {
            amountToAdd = amount!;
        }

        // Convert amount to contract units
        const decimals = Number(tokenInfo.decimals);
        const amountInWei = parseUnits(amountToAdd, decimals);
        await notify(`Amount in wei: ${amountInWei.toString()}`);

        // Check balance again with wei amount
        const userBalanceWei = parseUnits(tokenInfo.balance, decimals);
        if (userBalanceWei < amountInWei) {
            return toResult(
                `Insufficient ${tokenSymbol} balance. Required: ${amountToAdd}, Available: ${tokenInfo.balance}`,
                true
            );
        }

        // Get pool liquidity (optional)
        const poolLiquidityResult = await getPoolLiquidity({ 
            chainName, 
            publicClient 
        } as any, options);
        
        if (!poolLiquidityResult.success || !poolLiquidityResult.data) {
            await notify(`Failed to get pool liquidity: ${poolLiquidityResult.data}`);
            // Continue anyway, this is not critical
        } else {
            const liquidityData = JSON.parse(poolLiquidityResult.data);
            await notify(`Current ALP price: $${liquidityData.glpPrice}`);
        }

        const tokenIn = getTokenAddress(tokenSymbol, networkName);
        if (!tokenIn && tokenSymbol !== nativeSymbol) {
            return toResult(`Token ${tokenSymbol} not found on ${networkName}`, true);
        }
        const isNativeToken = tokenSymbol === nativeSymbol;
        let approvalHash: string | undefined;

        // --- Approve Transaction (for ERC20 tokens only) ---
        if (!isNativeToken) {
            const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
            if (!tokenInAddress) {
                return toResult(`Token address for ${tokenSymbol} not found`, true);
            }

            await notify(`Checking ${tokenSymbol} allowance for RewardRouter...`);
            // Use ethers.js to check allowance
            const erc20Interface = new ethers.Interface(ERC20);
            const tokenContract = new ethers.Contract(tokenInAddress, erc20Interface, provider);
            
            const allowance = await tokenContract.allowance(account, rewardRouterAddress);
            
            if (allowance < amountInWei) {
                await notify(`Allowance is ${formatUnits(allowance, decimals)}, needs ${formatUnits(amountInWei, decimals)}. Requesting approval...`);
                try {
                    // Send with ethers.js connected wallet
                    const tokenContractWithSigner = tokenContract.connect(wallet);
                    
                    // Use MAX_UINT256 for unlimited approval
                    const MAX_UINT256 = ethers.MaxUint256;
                    await notify(`Setting unlimited approval (MAX_UINT256) for ${tokenSymbol}`);
                    
                    await notify('Estimating gas for approval...');
                    const gasEstimate = await tokenContractWithSigner.getFunction('approve').estimateGas(
                        rewardRouterAddress, 
                        MAX_UINT256
                    );
                    
                    await notify(`Estimated gas: ${gasEstimate.toString()}`);
                    
                    // Send approval transaction
                    await notify('Sending approval transaction with ethers.js...');
                    const tx = await tokenContractWithSigner.getFunction('approve')(
                        rewardRouterAddress, 
                        MAX_UINT256,
                        {
                            gasLimit: Math.ceil(Number(gasEstimate) * 1.2) // Add 20% buffer
                        }
                    );
                    
                    approvalHash = tx.hash;
                    await notify(`Approval transaction sent: ${approvalHash}. Waiting for confirmation...`);
                    
                    const receipt = await tx.wait();
                    if (receipt && receipt.status === 1) {
                        await notify('Approval confirmed.');
                        
                        // Verify allowance after approval
                        const newAllowance = await tokenContract.allowance(account, rewardRouterAddress);
                        await notify(`New allowance: ${formatUnits(newAllowance, decimals)} ${tokenSymbol}`);
                        
                        if (newAllowance < amountInWei) {
                            return toResult(`Approval transaction successful but allowance is still insufficient. Required: ${formatUnits(amountInWei, decimals)}, Granted: ${formatUnits(newAllowance, decimals)}`, true);
                        }
                    } else {
                        throw new Error(`Approval transaction failed: ${approvalHash}`);
                    }
                } catch (e: any) {
                    await notify(`ERROR: Approval failed: ${e.message}`);
                    console.error("Approval Error:", e);
                    return toResult(`Approval failed: ${e.message}`, true);
                }
            } else {
                await notify(`Sufficient allowance already granted: ${formatUnits(allowance, decimals)} ${tokenSymbol}`);
            }
        }

        // --- Mint Transaction ---
        await notify('Preparing mint transaction...');
        
        const parsedMinUsdg = parseUnits(minUsdg, 18);
        const parsedMinGlp = parseUnits(minGlp, 18);

        let mintHash: string;
        try {
            // Create router contract with ethers.js
            const routerInterface = new ethers.Interface(RewardRouter);
            const routerContract = new ethers.Contract(rewardRouterAddress, routerInterface, wallet);
            
            if (isNativeToken) {
                // Native token mint
                await notify('Estimating gas for native token mint...');
                const gasEstimate = await routerContract.getFunction('mintAndStakeGlpETH').estimateGas(
                    parsedMinUsdg.toString(),
                    parsedMinGlp.toString(),
                    { value: amountInWei.toString() }
                );
                
                await notify(`Estimated gas for native token mint: ${gasEstimate.toString()}`);
                
                await notify('Sending native token mint transaction...');
                const tx = await routerContract.getFunction('mintAndStakeGlpETH')(
                    parsedMinUsdg.toString(),
                    parsedMinGlp.toString(),
                    {
                        value: amountInWei.toString(),
                        gasLimit: Math.ceil(Number(gasEstimate) * 1.2)
                    }
                );
                
                mintHash = tx.hash;
            } else {
                // ERC20 token mint
                const tokenInAddress = getTokenAddress(tokenSymbol, networkName);
                if (!tokenInAddress) {
                    return toResult(`Token address for ${tokenSymbol} not found on ${networkName}`, true);
                }
                
                await notify('Estimating gas for ERC20 token mint...');
                const gasEstimate = await routerContract.getFunction('mintAndStakeGlp').estimateGas(
                    tokenInAddress,
                    amountInWei.toString(),
                    parsedMinUsdg.toString(),
                    parsedMinGlp.toString()
                );
                
                await notify(`Estimated gas for ERC20 token mint: ${gasEstimate.toString()}`);
                
                await notify('Sending ERC20 token mint transaction...');
                const tx = await routerContract.getFunction('mintAndStakeGlp')(
                    tokenInAddress,
                    amountInWei.toString(),
                    parsedMinUsdg.toString(),
                    parsedMinGlp.toString(),
                    {
                        gasLimit: Math.ceil(Number(gasEstimate) * 1.2)
                    }
                );
                
                mintHash = tx.hash;
            }
            
            await notify(`Mint transaction sent: ${mintHash}`);
            
            // Wait for receipt with ethers
            await notify('Waiting for transaction confirmation...');
            const receipt = await provider.waitForTransaction(mintHash);
            
            if (receipt && receipt.status === 1) {
                await notify(`Mint transaction confirmed: ${mintHash}`);
            } else {
                throw new Error(`Mint transaction failed: ${mintHash}`);
            }
            
            // Parse event from receipt
            let alpReceived = 'N/A';
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    const logAddress = log.address.toLowerCase();
                    const targetAddress = glpManagerAddress.toLowerCase();
                    
                    if (logAddress === targetAddress) {
                        // Try to decode AddLiquidity event
                        try {
                            // The event signature hash
                            const eventSignature = ethers.id('AddLiquidity(address,address,uint256,uint256,uint256,uint256,uint256)');
                            if (log.topics[0] === eventSignature) {
                                const decodedEvent = ethers.AbiCoder.defaultAbiCoder().decode(
                                    ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                                    log.data
                                );
                                
                                if (decodedEvent && decodedEvent.length >= 5) {
                                    // The mintAmount is the last parameter
                                    alpReceived = formatUnits(decodedEvent[4], 18);
                                    await notify(`ALP received (from event): ${alpReceived}`);
                                    break;
                                }
                            }
                        } catch (decodeError: any) {
                            await notify(`Warning: Could not decode a potential AddLiquidity event - ${decodeError.message}`);
                        }
                    }
                }
            }
            
            if (alpReceived === 'N/A') {
                await notify('Warning: AddLiquidity event log not found or not parsed.');
            }
            
            return toResult(
                JSON.stringify({
                    success: true,
                    transactionHash: mintHash,
                    approvalHash: approvalHash,
                    details: {
                        tokenSymbol,
                        amountAdded: amountToAdd,
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