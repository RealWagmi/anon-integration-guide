import { createPublicClient, http, type Chain, type Transport, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getAllOpenPositions } from '../../functions/trading/leverage/getAllOpenPositions.js';
import { CHAIN_CONFIG, NETWORKS } from '../../constants.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Initialize client
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    }) as PublicClient<Transport, Chain>;

    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

    console.log('\nTesting getAllOpenPositions...');

    // Test 1: Invalid chain name
    console.log('\nTest 1: Invalid chain name');
    const invalidChainResult = await getAllOpenPositions(
        {
            chainName: 'invalid-chain' as any,
            account: account.address,
            isLong: true,
        },
        {
            evm: {
                getProvider: () => publicClient,
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );
    console.log('Invalid chain test result:', invalidChainResult);

    // Test 2: Invalid account address
    console.log('\nTest 2: Invalid account address');
    const invalidAccountResult = await getAllOpenPositions(
        {
            chainName: NETWORKS.SONIC,
            account: '0x0000000000000000000000000000000000000000',
            isLong: true,
        },
        {
            evm: {
                getProvider: () => publicClient,
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );
    console.log('Invalid account test result:', invalidAccountResult);

    // Test 3: Valid request for long positions
    console.log('\nTest 3: Valid request for long positions');
    const longResult = await getAllOpenPositions(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            isLong: true,
        },
        {
            evm: {
                getProvider: () => publicClient,
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );

    if (!longResult.success) {
        console.error('Failed to get long positions:', longResult.data);
    } else {
        console.log('\nLong positions request successful!');
        const data = JSON.parse(longResult.data);
        console.log('Positions details:', JSON.stringify(data, null, 2));
    }

    // Test 4: Valid request for short positions
    console.log('\nTest 4: Valid request for short positions');
    const shortResult = await getAllOpenPositions(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            isLong: false,
        },
        {
            evm: {
                getProvider: () => publicClient,
            },
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            }
        }
    );

    if (!shortResult.success) {
        console.error('Failed to get short positions:', shortResult.data);
    } else {
        console.log('\nShort positions request successful!');
        const data = JSON.parse(shortResult.data);
        console.log('Positions details:', JSON.stringify(data, null, 2));
    }
}

main().catch(console.error); 