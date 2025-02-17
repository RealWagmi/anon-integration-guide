import { createPublicClient, createWalletClient, http, type Chain, type Transport, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity } from '../../functions/liquidity/addLiquidity.js';
import { CHAIN_CONFIG, NETWORKS } from '../../constants.js';
import { type FunctionOptions } from '@heyanon/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Initialize clients
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    }) as PublicClient<Transport, Chain>;

    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
        account,
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    });

    // Test invalid inputs first
    console.log('\nTesting invalid inputs...');
    
    // Test 1: Invalid amount
    console.log('\nTest 1: Invalid amount');
    const invalidAmountResult = await addLiquidity(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            tokenSymbol: 'ANON',
            amount: '-1',
            minUsdg: '0',
            minGlp: '0'
        },
        {
            evm: {
                getProvider: () => publicClient,
                sendTransactions: async ({ transactions }) => {
                    const hashes = await Promise.all(
                        transactions.map(async (tx) => {
                            const hash = await walletClient.sendTransaction({
                                to: tx.target,
                                data: tx.data,
                                value: tx.value || 0n,
                            });
                            return { hash, message: 'Transaction submitted successfully' };
                        }),
                    );
                    return {
                        isMultisig: false,
                        data: hashes
                    };
                }
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );
    console.log('Invalid amount test result:', invalidAmountResult);

    // Test 2: Both amount and percentOfBalance
    console.log('\nTest 2: Both amount and percentOfBalance');
    const invalidParamsResult = await addLiquidity(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            tokenSymbol: 'ANON',
            amount: '0.05',
            percentOfBalance: 50,
            minUsdg: '0',
            minGlp: '0'
        },
        {
            evm: {
                getProvider: () => publicClient,
                sendTransactions: async ({ transactions }) => {
                    const hashes = await Promise.all(
                        transactions.map(async (tx) => {
                            const hash = await walletClient.sendTransaction({
                                to: tx.target,
                                data: tx.data,
                                value: tx.value || 0n,
                            });
                            return { hash, message: 'Transaction submitted successfully' };
                        }),
                    );
                    return {
                        isMultisig: false,
                        data: hashes
                    };
                }
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );
    console.log('Invalid params test result:', invalidParamsResult);

    // Test 3: Valid transaction
    console.log('\nTest 3: Valid transaction');
    const result = await addLiquidity(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            tokenSymbol: 'ANON',
            amount: '0.05',
            minUsdg: '0',
            minGlp: '0'
        },
        {
            evm: {
                getProvider: () => publicClient,
                sendTransactions: async ({ transactions }) => {
                    const hashes = await Promise.all(
                        transactions.map(async (tx) => {
                            const hash = await walletClient.sendTransaction({
                                to: tx.target,
                                data: tx.data,
                                value: tx.value || 0n,
                            });
                            return { hash, message: 'Transaction submitted successfully' };
                        }),
                    );
                    return {
                        isMultisig: false,
                        data: hashes
                    };
                }
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );

    if (!result.success) {
        throw new Error(`Failed to add liquidity: ${result.data}`);
    }

    console.log('\nTransaction successful!');
    console.log('Result:', JSON.parse(result.data));
}

main().catch(console.error);
