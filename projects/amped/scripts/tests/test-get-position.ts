import { createPublicClient, http, type Chain, type Transport, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getPosition } from '../../functions/trading/leverage/getPosition.js';
import { CHAIN_CONFIG, NETWORKS, CONTRACT_ADDRESSES } from '../../constants.js';
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
    console.log('Testing positions for account:', account.address);

    // Test WETH long position
    console.log('\nTesting WETH long position...');
    const wethLongResult = await getPosition(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
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

    console.log('WETH long position result:', JSON.stringify(wethLongResult, null, 2));

    // Test ANON long position
    console.log('\nTesting ANON long position...');
    const anonLongResult = await getPosition(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
            collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
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

    console.log('ANON long position result:', JSON.stringify(anonLongResult, null, 2));

    // Test WETH short position with USDC collateral
    console.log('\nTesting WETH short position with USDC collateral...');
    const wethShortResult = await getPosition(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
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

    console.log('WETH short position result:', JSON.stringify(wethShortResult, null, 2));

    // Test ANON short position with USDC collateral
    console.log('\nTesting ANON short position with USDC collateral...');
    const anonShortResult = await getPosition(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
            indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
            collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
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

    console.log('ANON short position result:', JSON.stringify(anonShortResult, null, 2));
}

main().catch(console.error); 