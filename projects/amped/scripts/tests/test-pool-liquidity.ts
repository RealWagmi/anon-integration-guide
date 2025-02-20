import { createPublicClient, http, type Chain, type Transport, type PublicClient } from 'viem';
import { getPoolLiquidity } from '../../functions/liquidity/getPoolLiquidity.js';
import { CHAIN_CONFIG, NETWORKS } from '../../constants.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Initialize client
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC] as Chain,
        transport: http(),
    }) as PublicClient<Transport, Chain>;

    console.log('\nTesting getPoolLiquidity...');

    // Test 1: Invalid chain name
    console.log('\nTest 1: Invalid chain name');
    const invalidChainResult = await getPoolLiquidity(
        {
            chainName: 'invalid-chain',
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

    // Test 2: Valid request
    console.log('\nTest 2: Valid request');
    const result = await getPoolLiquidity(
        {
            chainName: NETWORKS.SONIC,
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
        throw new Error(`Failed to get pool liquidity: ${result.data}`);
    }

    console.log('\nRequest successful!');
    const data = JSON.parse(result.data);
    
    // Print formatted pool liquidity info
    console.log('\nPool Overview:');
    console.log(`Total Supply: ${data.totalSupply} ALP`);
    console.log(`Total Value Locked: $${data.aum}`);
    console.log(`ALP Price: $${data.aumPerToken}`);

    console.log('\nToken Liquidity:');
    data.tokens.forEach((token: any) => {
        console.log(`\n${token.symbol}:`);
        console.log(`  Pool Amount: ${token.poolAmount}`);
        console.log(`  Reserved Amount: ${token.reservedAmount}`);
        console.log(`  Available Amount: ${token.availableAmount}`);
        console.log(`  Price: $${token.price}`);
        console.log(`  Pool Value: $${token.poolAmountUsd}`);
        console.log(`  Reserved Value: $${token.reservedAmountUsd}`);
        console.log(`  Available Value: $${token.availableAmountUsd}`);
    });
}

main().catch(console.error);
