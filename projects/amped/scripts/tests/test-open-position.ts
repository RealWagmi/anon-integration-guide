import { createPublicClient, createWalletClient, http, type Chain, type PublicClient, type WalletClient, type Transport } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { openPosition } from '../../functions/trading/leverage/openPosition.js';
import { CHAIN_CONFIG, NETWORKS, CONTRACT_ADDRESSES } from '../../constants.js';
import { type FunctionOptions } from '@heyanon/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Initialize clients
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    }) as PublicClient;

    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
        account,
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    });

    console.log('\nTesting openPosition...');
    console.log('Account:', account.address);

    try {
        // Test opening a WETH long position with 7x leverage
        const collateralUsd = '10'; // $10 collateral
        const leverage = 7;
        const sizeUsd = (Number(collateralUsd) * leverage).toString(); // $70 position size

        const result = await openPosition(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
                collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, // Using WETH as collateral
                isLong: true,
                sizeUsd,
                collateralUsd,
                slippageBps: 30
            },
            {
                evm: {
                    getProvider: () => publicClient,
                    sendTransactions: async ({ transactions }) => {
                        const hashes = await Promise.all(
                            transactions.map(async (tx) => {
                                console.log('Transaction details:', {
                                    to: tx.target,
                                    data: tx.data,
                                    value: tx.value ? tx.value.toString() : '0'
                                });
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