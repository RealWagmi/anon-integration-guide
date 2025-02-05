import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { getPerpsLiquidity } from '../../functions/trading/leverage/getPerpsLiquidity.js';
import { FunctionOptions } from '@heyanon/sdk';
import 'dotenv/config';

async function runTest(testName: string, fn: () => Promise<void>) {
    console.log(`\n${testName}`);
    console.log('='.repeat(testName.length));
    try {
        await fn();
        console.log(`✅ ${testName} passed`);
    } catch (error) {
        console.error(`❌ ${testName} failed:`, error);
        throw error;
    }
}

async function main() {
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account from private key
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log('Address:', account.address);

    // Create public client
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    // SDK options
    const sdkOptions: FunctionOptions = {
        getProvider: () => publicClient,
        notify: async (message: string) => console.log('Notification:', message),
        sendTransactions: async () => ({ isMultisig: false, data: [] }),
    };

    // Test invalid network
    await runTest('Network Validation Test', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: account.address,
                indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                isLong: true,
            },
            sdkOptions,
        );

        if (result.success || !result.data.includes('is not supported for trading')) {
            throw new Error('Should reject unsupported trading token');
        }
    });

    // Test invalid account
    await runTest('Invalid Account Test', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: '0x0000000000000000000000000000000000000000',
                indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
                collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                isLong: true,
            },
            sdkOptions,
        );

        if (result.success || !result.data.includes('Zero address is not a valid account')) {
            throw new Error('Should reject zero address account');
        }
    });

    // Test invalid token
    await runTest('Invalid Token Test', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: account.address,
                indexToken: '0x0000000000000000000000000000000000000000',
                collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                isLong: true,
            },
            sdkOptions,
        );

        if (result.success || !result.data.includes('Zero addresses are not valid tokens')) {
            throw new Error('Should reject zero address token');
        }
    });

    // Test supported trading tokens
    const supportedTokens = [
        { name: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
        { name: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN },
        { name: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    ];

    for (const token of supportedTokens) {
        // Test long position
        await runTest(`${token.name} Long Position Test`, async () => {
            const result = await getPerpsLiquidity(
                {
                    chainName: 'sonic',
                    account: account.address,
                    indexToken: token.address,
                    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                    isLong: true,
                },
                sdkOptions,
            );

            if (!result.success) {
                throw new Error(`Failed to get ${token.name} long liquidity: ${result.data}`);
            }

            const data = JSON.parse(result.data);
            console.log('\nLiquidity Information:');
            console.log('---------------------');
            console.log(`Max Leverage: ${data.maxLeverage}x`);
            console.log(`Pool Amount: ${data.poolAmount} ${token.name} ($${data.poolAmountUsd})`);
            console.log(`Reserved Amount: ${data.reservedAmount} ${token.name} ($${data.reservedAmountUsd})`);
            console.log(`Available Liquidity: ${data.availableLiquidity} ${token.name} ($${data.availableLiquidityUsd})`);
            console.log(`Current Price: $${data.priceUsd}`);
        });

        // Test short position
        await runTest(`${token.name} Short Position Test`, async () => {
            const result = await getPerpsLiquidity(
                {
                    chainName: 'sonic',
                    account: account.address,
                    indexToken: token.address,
                    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                    isLong: false,
                },
                sdkOptions,
            );

            if (!result.success) {
                throw new Error(`Failed to get ${token.name} short liquidity: ${result.data}`);
            }

            const data = JSON.parse(result.data);
            console.log('\nLiquidity Information:');
            console.log('---------------------');
            console.log(`Max Leverage: ${data.maxLeverage}x`);
            console.log(`Pool Amount: ${data.poolAmount} ${token.name} ($${data.poolAmountUsd})`);
            console.log(`Reserved Amount: ${data.reservedAmount} ${token.name} ($${data.reservedAmountUsd})`);
            console.log(`Available Liquidity: ${data.availableLiquidity} ${token.name} ($${data.availableLiquidityUsd})`);
            console.log(`Current Price: $${data.priceUsd}`);
        });
    }

    console.log('\nAll tests completed successfully! ✨');
}

main().catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
});
