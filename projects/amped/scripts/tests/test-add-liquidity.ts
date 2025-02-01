import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity } from '../../functions/liquidity/addLiquidity.js';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { sonic } from '../../chains.js';
import { ERC20 } from '../../abis/ERC20.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY is required in .env file');
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using account:', account.address);

    // Set up the provider and wallet client
    const rpcUrl = process.env.SONIC_RPC_URL;
    if (!rpcUrl) {
        throw new Error('SONIC_RPC_URL is required in .env file');
    }

    const publicClient = createPublicClient({
        chain: sonic,
        transport: http(rpcUrl)
    });

    const walletClient = createWalletClient({
        chain: sonic,
        transport: http(rpcUrl),
        account
    });

    // Log contract addresses
    console.log('\nContract Addresses:');
    console.log('WETH:', CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH);
    console.log('Reward Router:', CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER);
    console.log('GLP Manager:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER);

    // Check WETH balance first
    const wethContract = {
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
        abi: ERC20
    };

    const [wethBalance, wethDecimals, wethSymbol] = await Promise.all([
        publicClient.readContract({
            ...wethContract,
            functionName: 'balanceOf',
            args: [account.address]
        }),
        publicClient.readContract({
            ...wethContract,
            functionName: 'decimals'
        }),
        publicClient.readContract({
            ...wethContract,
            functionName: 'symbol'
        })
    ]);

    console.log(`\nCurrent ${wethSymbol} balance: ${formatEther(wethBalance)} ${wethSymbol}`);

    // We'll use a smaller amount first to test
    const amountInEth = '0.001';
    const parsedAmount = parseEther(amountInEth);

    if (wethBalance < parsedAmount) {
        throw new Error(`Insufficient ${wethSymbol} balance. Need ${amountInEth} ${wethSymbol} but have ${formatEther(wethBalance)} ${wethSymbol}`);
    }

    // Check current allowances
    const [routerAllowance, glpManagerAllowance] = await Promise.all([
        publicClient.readContract({
            ...wethContract,
            functionName: 'allowance',
            args: [account.address, CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER]
        }),
        publicClient.readContract({
            ...wethContract,
            functionName: 'allowance',
            args: [account.address, CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER]
        })
    ]);

    console.log(`\nCurrent allowances:`);
    console.log(`- Reward Router: ${formatEther(routerAllowance)} ${wethSymbol}`);
    console.log(`- GLP Manager: ${formatEther(glpManagerAllowance)} ${wethSymbol}`);

    // Approve GLP Manager if needed
    if (glpManagerAllowance < parsedAmount) {
        console.log('\nApproving WETH for GLP Manager...');
        const approvalHash = await walletClient.writeContract({
            ...wethContract,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER, parsedAmount]
        });
        console.log('Approval transaction hash:', approvalHash);
        
        // Wait for approval to be mined
        console.log('Waiting for approval transaction to be mined...');
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('Approval confirmed');
    }

    console.log(`\nAdding liquidity with ${amountInEth} ${wethSymbol}...`);

    try {
        const result = await addLiquidity({
            chainName: NETWORKS.SONIC,
            account: account.address,
            tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            amount: amountInEth
        }, {
            getProvider: () => publicClient,
            notify: async (message: string) => {
                console.log(message);
            },
            sendTransactions: async ({ transactions }) => {
                const txResults = [];
                
                for (const tx of transactions) {
                    console.log('\nSending transaction:', {
                        to: tx.target,
                        value: tx.value?.toString() || '0',
                        dataLength: tx.data.length,
                        data: tx.data // Log full data for debugging
                    });

                    const hash = await walletClient.sendTransaction({
                        chain: sonic,
                        to: tx.target,
                        value: tx.value || 0n,
                        data: tx.data as `0x${string}`
                    });

                    console.log('Transaction hash:', hash);
                    
                    // Wait for transaction to be mined
                    console.log('Waiting for transaction to be mined...');
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    console.log('Transaction confirmed:', receipt.status === 'success' ? 'Success' : 'Failed');
                    
                    txResults.push({
                        hash,
                        message: 'Transaction sent successfully'
                    });
                }

                return {
                    isMultisig: false,
                    data: txResults
                };
            }
        });

        try {
            const response = JSON.parse(result.data);
            console.log('\nTransaction successful!');
            console.log('Transaction hash:', response.transactionHash);
            console.log('\nDetails:');
            console.log('- Amount:', formatEther(BigInt(response.details.amount)), wethSymbol);
            console.log('- Token:', response.details.tokenIn);
        } catch {
            console.error('Error:', result.data);
        }
    } catch (error) {
        console.error('Error executing addLiquidity:', error);
    }
}

main().catch(console.error); 