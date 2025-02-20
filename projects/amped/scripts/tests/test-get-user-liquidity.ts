import { createPublicClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { getUserLiquidity } from '../../functions/liquidity/getUserLiquidity.js';
import 'dotenv/config';

async function test() {
    console.log('\nTesting getUserLiquidity function...');

    // Check for private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account and client
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log('Address:', account.address);

    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    try {
        // Test with valid parameters
        console.log('\nTesting with valid parameters:');
        console.log('----------------------------');
        const result = await getUserLiquidity(
            { chainName: 'sonic', account: account.address as Address },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async () => {
                    throw new Error('Should not be called');
                },
            },
        );

        if (result.success) {
            const data = JSON.parse(result.data);
            console.log('\nUser Liquidity Information:');
            console.log('-------------------------');
            console.log(`Total Balance: ${Number(data.balance).toLocaleString()} ALP`);
            console.log(`Available Amount: ${Number(data.availableAmount).toLocaleString()} ALP`);
            console.log(`Reserved Amount: ${Number(data.reservedAmount).toLocaleString()} ALP`);
            console.log(`USD Value: $${Number(data.usdValue).toLocaleString()}`);
            console.log(`Available USD Value: $${Number(data.availableUsdValue).toLocaleString()}`);
            console.log(`Reserved USD Value: $${Number(data.reservedUsdValue).toLocaleString()}`);
            console.log(`ALP Price: $${Number(data.alpPrice).toLocaleString()}`);
            console.log(`Claimable Rewards: ${data.claimableRewards}`);
        } else {
            console.error('\nError:', result.data);
        }

        // Test with invalid chain
        console.log('\nTesting with invalid chain:');
        console.log('-------------------------');
        try {
            await getUserLiquidity(
                { chainName: 'invalid' as any, account: account.address as Address },
                {
                    getProvider: (_chainId: number) => publicClient,
                    notify: async (msg: string) => console.log('Notification:', msg),
                    sendTransactions: async () => {
                        throw new Error('Should not be called');
                    },
                },
            );
            console.error('❌ Should have rejected invalid chain');
        } catch (error) {
            console.log('✅ Successfully rejected invalid chain');
            console.log('Error:', error instanceof Error ? error.message : 'Unknown error');
        }

        // Test with zero address
        console.log('\nTesting with zero address:');
        console.log('------------------------');
        const zeroAddressResult = await getUserLiquidity(
            { chainName: 'sonic', account: '0x0000000000000000000000000000000000000000' as Address },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async () => {
                    throw new Error('Should not be called');
                },
            },
        );

        if (!zeroAddressResult.success) {
            console.log('✅ Successfully rejected zero address');
            console.log('Error:', zeroAddressResult.data);
        } else {
            console.error('❌ Should have rejected zero address');
        }

        console.log('\nAll tests completed successfully! ✨');
    } catch (error) {
        console.error('\nUnexpected Error:');
        console.error('----------------');
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        } else {
            console.error('Unknown error:', error);
        }
        process.exit(1);
    }
}

test().catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
