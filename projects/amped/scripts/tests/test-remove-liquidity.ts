import { createPublicClient, createWalletClient, http, Address, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { removeLiquidity } from '../../functions/liquidity/removeLiquidity.js';
import { getUserLiquidity } from '../../functions/liquidity/getUserLiquidity.js';
import 'dotenv/config';

// Define Sonic chain
export const sonic = {
    id: 146,
    name: 'Sonic',
    nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'SONIC',
    },
    rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] },
    },
    blockExplorers: {
        default: { name: 'SonicScan', url: 'https://explorer.sonic.oasys.games' },
    },
} as const;

async function test() {
    console.log('\nTesting remove liquidity...');

    // Check for private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account and clients
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log('Address:', account.address);

    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    const walletClient = createWalletClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
        account,
    });

    try {
        // First get user's current liquidity
        console.log('\nChecking current liquidity...');
        const userLiquidityResult = await getUserLiquidity(
            { chainName: 'sonic', account: account.address as Address },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async () => {
                    throw new Error('Should not be called');
                },
            },
        );

        if (!userLiquidityResult.success) {
            throw new Error(`Failed to get user liquidity: ${userLiquidityResult.data}`);
        }

        const userLiquidity = JSON.parse(userLiquidityResult.data);
        console.log('\nCurrent Liquidity:');
        console.log('-----------------');
        console.log(`Total fsALP Balance: ${Number(userLiquidity.balance).toLocaleString()} fsALP`);
        console.log(`Reserved in Vesting: ${Number(userLiquidity.reservedAmount).toLocaleString()} fsALP`);
        console.log(`Available to Remove: ${Number(userLiquidity.availableAmount).toLocaleString()} fsALP`);
        console.log(`Total USD Value: $${Number(userLiquidity.usdValue).toLocaleString()}`);
        console.log(`Reserved USD Value: $${Number(userLiquidity.reservedUsdValue).toLocaleString()}`);
        console.log(`Available USD Value: $${Number(userLiquidity.availableUsdValue).toLocaleString()}`);
        console.log(`ALP Price: $${Number(userLiquidity.alpPrice).toLocaleString()}`);

        if (Number(userLiquidity.availableAmount) === 0) {
            throw new Error('No liquidity available to remove');
        }

        // Remove a small amount (5%) of available liquidity in native token
        const amountToRemove = (Number(userLiquidity.availableAmount) * 0.05).toFixed(18);

        // Test native token (S) removal
        console.log('\nTesting Native Token (S) Removal:');
        console.log('-------------------------------');
        console.log(`Amount to Remove: ${Number(amountToRemove).toLocaleString()} ALP`);
        console.log('Token Out: Native Token (S)');
        console.log('Slippage Tolerance: 1.0%');

        const nativeResult = await removeLiquidity(
            {
                chainName: 'sonic',
                account: account.address as Address,
                tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN as Address,
                amount: amountToRemove,
                slippageTolerance: 1.0, // 1% slippage tolerance
            },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async ({ transactions }) => {
                    const [tx] = transactions;
                    console.log('\nTransaction Details:');
                    console.log('-------------------');
                    console.log('To:', tx.target);
                    console.log('Value:', (tx.value ?? 0n).toString());
                    console.log('Data:', tx.data);

                    const hash = await walletClient.sendTransaction({
                        to: tx.target,
                        data: tx.data,
                        value: tx.value ?? 0n,
                    });

                    console.log('\nTransaction submitted:', hash);

                    // Wait for confirmation
                    console.log('\nWaiting for confirmation...');
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    console.log('\nTransaction Status:');
                    console.log('------------------');
                    console.log('Block Number:', receipt.blockNumber);
                    console.log('Gas Used:', receipt.gasUsed.toString());
                    console.log('Status:', receipt.status === 'success' ? '✅ Success' : '❌ Failed');

                    return {
                        success: true,
                        data: [
                            {
                                hash,
                                message: 'Transaction submitted successfully',
                            },
                        ],
                        isMultisig: false,
                    };
                },
            },
        );

        if (nativeResult.success) {
            const details = JSON.parse(nativeResult.data);
            console.log('\nNative Token Removal Result:');
            console.log('--------------------------');
            console.log('Status: ✅ Success');
            console.log('Transaction Hash:', details.hash);
            console.log('Removed Amount:', Number(details.details.amount).toLocaleString(), 'ALP');
            console.log('Token Out:', details.details.tokenOut);
            console.log('Min Out:', formatUnits(BigInt(details.details.minOut), 18), 'S');
        } else {
            console.error('\nFailed to remove native token liquidity:', nativeResult.data);
        }

        // Test wrapped token (WS) removal
        console.log('\nTesting Wrapped Token (WS) Removal:');
        console.log('---------------------------------');
        console.log(`Amount to Remove: ${Number(amountToRemove).toLocaleString()} ALP`);
        console.log('Token Out: Wrapped Token (WS)');
        console.log('Slippage Tolerance: 1.0%');

        const wrappedResult = await removeLiquidity(
            {
                chainName: 'sonic',
                account: account.address as Address,
                tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN as Address,
                amount: amountToRemove,
                slippageTolerance: 1.0, // 1% slippage tolerance
            },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async ({ transactions }) => {
                    const [tx] = transactions;
                    console.log('\nTransaction Details:');
                    console.log('-------------------');
                    console.log('To:', tx.target);
                    console.log('Value:', (tx.value ?? 0n).toString());
                    console.log('Data:', tx.data);

                    const hash = await walletClient.sendTransaction({
                        to: tx.target,
                        data: tx.data,
                        value: tx.value ?? 0n,
                    });

                    console.log('\nTransaction submitted:', hash);

                    // Wait for confirmation
                    console.log('\nWaiting for confirmation...');
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    console.log('\nTransaction Status:');
                    console.log('------------------');
                    console.log('Block Number:', receipt.blockNumber);
                    console.log('Gas Used:', receipt.gasUsed.toString());
                    console.log('Status:', receipt.status === 'success' ? '✅ Success' : '❌ Failed');

                    return {
                        success: true,
                        data: [
                            {
                                hash,
                                message: 'Transaction submitted successfully',
                            },
                        ],
                        isMultisig: false,
                    };
                },
            },
        );

        if (wrappedResult.success) {
            const details = JSON.parse(wrappedResult.data);
            console.log('\nWrapped Token Removal Result:');
            console.log('---------------------------');
            console.log('Status: ✅ Success');
            console.log('Transaction Hash:', details.hash);
            console.log('Removed Amount:', Number(details.details.amount).toLocaleString(), 'ALP');
            console.log('Token Out:', details.details.tokenOut);
            console.log('Min Out:', formatUnits(BigInt(details.details.minOut), 18), 'WS');
        } else {
            console.error('\nFailed to remove wrapped token liquidity:', wrappedResult.data);
        }

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
