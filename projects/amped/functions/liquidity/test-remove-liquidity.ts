import { createPublicClient, http, getContract, formatUnits, parseUnits, Address, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import { removeLiquidity } from './removeLiquidity.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getTokenPrice(publicClient: any, tokenAddress: string) {
    const vault = getContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT as Address,
        abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'getMinPrice',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
        }],
        client: publicClient
    });

    const price = await publicClient.readContract({
        ...vault,
        functionName: 'getMinPrice',
        args: [tokenAddress as Address]
    });

    return Number(formatUnits(price as bigint, 30)); // Price is in 30 decimals
}

async function getTokenLiquidity(publicClient: any, tokenAddress: string) {
    const vault = getContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT as Address,
        abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'poolAmounts',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
        }, {
            inputs: [{ name: '_token', type: 'address' }],
            name: 'reservedAmounts',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
        }],
        client: publicClient
    });

    const [poolAmount, reservedAmount] = await Promise.all([
        publicClient.readContract({
            ...vault,
            functionName: 'poolAmounts',
            args: [tokenAddress as Address]
        }),
        publicClient.readContract({
            ...vault,
            functionName: 'reservedAmounts',
            args: [tokenAddress as Address]
        })
    ]);

    const availableAmount = (poolAmount as bigint) - (reservedAmount as bigint);
    const decimals = tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase() ? 6 : 18;
    const price = await getTokenPrice(publicClient, tokenAddress);
    
    const poolAmountFormatted = Number(formatUnits(poolAmount as bigint, decimals));
    const reservedAmountFormatted = Number(formatUnits(reservedAmount as bigint, decimals));
    const availableAmountFormatted = Number(formatUnits(availableAmount, decimals));
    
    return {
        poolAmount: poolAmountFormatted,
        reservedAmount: reservedAmountFormatted,
        availableAmount: availableAmountFormatted,
        price,
        poolAmountUsd: poolAmountFormatted * price,
        reservedAmountUsd: reservedAmountFormatted * price,
        availableAmountUsd: availableAmountFormatted * price,
        decimals
    };
}

async function main() {
    // Create public client
    const publicClient = createPublicClient({
        chain: {
            id: 146,
            name: 'Sonic',
            network: 'sonic',
            nativeCurrency: {
                name: 'Sonic',
                symbol: 'S',
                decimals: 18
            },
            rpcUrls: {
                default: { http: [RPC_URLS[NETWORKS.SONIC]] }
            }
        },
        transport: http()
    });

    // Check if we have a private key
    const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('TEST_WALLET_PRIVATE_KEY not found in environment variables');
    }

    // Create test account from private key
    const testAccount = privateKeyToAccount(privateKey as `0x${string}`);

    console.log('Testing liquidity removal...');
    console.log('Using contracts:');
    console.log('- GLP Token:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN);
    console.log('- GLP Manager:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER);
    console.log('- Vault:', CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT);
    console.log('- Test Account:', testAccount.address);

    try {
        // First get overall pool liquidity
        const result = await getPoolLiquidity('sonic', {
            getProvider: () => publicClient,
            notify: async (msg: string) => console.log('Notification:', msg),
            sendTransactions: async () => {
                throw new Error('sendTransactions should not be called in this test');
            }
        });

        if (!result.success) {
            console.log('Error:', result.data);
            return;
        }

        const data = JSON.parse(result.data);
        console.log('\nPool Liquidity Information:');
        console.log('- Total Supply:', data.totalSupply, 'GLP');
        console.log('- Assets Under Management (AUM):', '$' + Number(data.aum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'USD');

        // Check liquidity for specific tokens
        console.log('\nToken-Specific Liquidity:');
        
        const tokens = {
            'USDC': CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
            'NATIVE': CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
            'WETH': CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            'ANON': CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
        };

        const liquidityInfo: Record<string, any> = {};
        
        for (const [symbol, address] of Object.entries(tokens)) {
            console.log(`\n${symbol}:`);
            const liquidity = await getTokenLiquidity(publicClient, address);
            liquidityInfo[symbol] = liquidity;
            
            console.log('- Pool Amount:', liquidity.poolAmount.toFixed(6), `${symbol} ($${liquidity.poolAmountUsd.toFixed(2)} USD)`);
            console.log('- Reserved Amount:', liquidity.reservedAmount.toFixed(6), `${symbol} ($${liquidity.reservedAmountUsd.toFixed(2)} USD)`);
            console.log('- Available Amount:', liquidity.availableAmount.toFixed(6), `${symbol} ($${liquidity.availableAmountUsd.toFixed(2)} USD)`);
            console.log('- Price:', `$${liquidity.price.toFixed(2)} USD`);
        }

        // Find tokens with adequate liquidity (> $1)
        const adequateTokens = Object.entries(liquidityInfo)
            .filter(([_, info]) => info.availableAmountUsd >= 1)
            .map(([symbol, _]) => symbol);

        if (adequateTokens.length === 0) {
            console.log('\nNo tokens have adequate liquidity (>= $1) for redemption');
            return;
        }

        console.log('\nTokens with adequate liquidity for $1 redemption:');
        adequateTokens.forEach(symbol => {
            const info = liquidityInfo[symbol];
            console.log(`- ${symbol}: $${info.availableAmountUsd.toFixed(2)} available`);
        });

        console.log('\nPlease choose one of the following tokens for redemption:');
        console.log(adequateTokens.join(', '));
        console.log('\nThen run the script again with the chosen token as an argument:');
        console.log('npm run test-remove-liquidity [TOKEN_SYMBOL]');

        // If a token was provided as an argument, proceed with redemption
        const chosenToken = process.argv[2];
        if (chosenToken && adequateTokens.includes(chosenToken)) {
            const token = chosenToken;
            const info = liquidityInfo[token];
            
            // Calculate GLP amount needed for $0.01 worth based on GLP price
            const glpPrice = Number(data.aum) / Number(data.totalSupply); // Price per GLP in USD
            const glpAmount = (0.01 / glpPrice).toFixed(18); // Amount of GLP needed for $0.01 worth
            // Calculate minOutAmount based on token price with 5% slippage tolerance
            const minOutAmount = token === 'USDC' ? '0.0099' : 
                               ((0.01 / info.price) * 0.95).toFixed(8); // For non-USDC tokens, calculate amount needed for $0.01 worth with 5% slippage
            
            console.log('\nTransaction Parameters:');
            console.log('- GLP Price:', `$${glpPrice.toFixed(4)} USD`);
            console.log('- GLP Amount to remove:', glpAmount);
            console.log('- Token:', token);
            console.log('- Token Address:', tokens[token as keyof typeof tokens]);
            console.log('- Min Output Amount:', minOutAmount);
            console.log('- Available Pool Liquidity:', info.availableAmount, token);
            console.log('- Available Pool Liquidity USD:', '$' + info.availableAmountUsd.toFixed(2));
            console.log('- Is Native Token:', token === 'NATIVE' ? 'Yes' : 'No');

            const result = await removeLiquidity({
                chainName: 'sonic',
                account: testAccount.address,
                tokenOut: tokens[token as keyof typeof tokens],
                amount: glpAmount,
                minOut: minOutAmount
            }, {
                getProvider: () => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async (txs) => {
                    console.log('\nExecuting transactions...');
                    const walletClient = createWalletClient({
                        account: testAccount,
                        chain: publicClient.chain,
                        transport: http()
                    });

                    const results = [];
                    for (const tx of txs.transactions) {
                        console.log(`\nSending transaction to ${tx.target}...`);
                        try {
                            const hash = await walletClient.sendTransaction({
                                to: tx.target as Address,
                                data: tx.data as `0x${string}`,
                                chain: publicClient.chain
                            });
                            console.log('Transaction hash:', hash);
                            results.push({
                                message: 'Transaction sent successfully',
                                success: true,
                                hash
                            });
                        } catch (error) {
                            console.error('Transaction failed:', error);
                            throw error; // Propagate the error instead of continuing
                        }
                    }
                    return { success: true, data: results, isMultisig: false };
                }
            });

            if (!result.success) {
                console.log('\nRemove liquidity failed:', result.data);
                // Try to decode the error if it's a contract revert
                if (typeof result.data === 'string' && result.data.includes('insufficient')) {
                    console.log('\nAnalyzing error:');
                    const match = result.data.match(/Required: ([\d.]+), Available: ([\d.]+)/);
                    if (match) {
                        console.log('Required amount:', match[1]);
                        console.log('Available amount:', match[2]);
                        console.log('\nThis suggests there might be a discrepancy between reported and actual available liquidity.');
                    }
                }
            } else {
                console.log('\nRemove liquidity succeeded:', result.data);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error); 