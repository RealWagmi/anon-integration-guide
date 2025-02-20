import { createPublicClient, createWalletClient, http, type Chain, type PublicClient, type WalletClient, type Transport } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { closePosition } from '../../functions/trading/leverage/closePosition.js';
import { CHAIN_CONFIG, NETWORKS, CONTRACT_ADDRESSES } from '../../constants.js';
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

    console.log('\nTesting closePosition...');
    console.log('Account:', account.address);

    try {
        // Test closing WETH positions with single token path
        const result = await closePosition(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
                collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
                slippageBps: 50,
                withdrawETH: true
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

        console.log('\nResult:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error); 