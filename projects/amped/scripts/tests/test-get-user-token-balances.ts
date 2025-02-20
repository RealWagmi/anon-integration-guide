import { createPublicClient, http, type Chain, type Transport, type PublicClient, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getUserTokenBalances } from '../../functions/liquidity/getUserTokenBalances.js';
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

    console.log('\nTesting getUserTokenBalances...');

    // Test 1: Invalid chain name
    console.log('\nTest 1: Invalid chain name');
    const invalidChainResult = await getUserTokenBalances(
        {
            chainName: 'invalid-chain',
            account: account.address,
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
    const invalidAccountResult = await getUserTokenBalances(
        {
            chainName: NETWORKS.SONIC,
            account: '0x0000000000000000000000000000000000000000',
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

    // Test 3: Valid request
    console.log('\nTest 3: Valid request');
    const result = await getUserTokenBalances(
        {
            chainName: NETWORKS.SONIC,
            account: account.address,
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

    if (!result.success) {
        throw new Error(`Failed to get token balances: ${result.data}`);
    }

    console.log('\nRequest successful!');
    const data = JSON.parse(result.data);
    
    // Print formatted token balances
    console.log('\nToken Balances:');
    data.tokens.forEach((token: any) => {
        console.log(`\n${token.symbol}:`);
        console.log(`  Balance: ${token.balance} ${token.symbol}`);
        console.log(`  USD Value: $${Number(token.balanceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`  Price: $${Number(token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`);
    });

    // Format total balance
    console.log(`\nTotal Balance USD: $${data.totalBalanceUsd}`);
}

main().catch(console.error);
