import { createPublicClient, createWalletClient, http, Address, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
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
    console.log('\nTesting remove liquidity (WETH)...');

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

    const transport = http('https://rpc.soniclabs.com');
    const publicClient = createPublicClient({
        chain: sonic,
        transport,
    });

    const walletClient = createWalletClient({
        chain: sonic,
        transport,
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
        console.log(`Total Balance: ${Number(userLiquidity.balance).toLocaleString()} ALP`);
        console.log(`Available Amount: ${Number(userLiquidity.availableAmount).toLocaleString()} ALP`);
        console.log(`USD Value: $${Number(userLiquidity.usdValue).toLocaleString()}`);
        console.log(`ALP Price: $${Number(userLiquidity.alpPrice).toLocaleString()}`);

        if (Number(userLiquidity.availableAmount) === 0) {
            throw new Error('No liquidity available to remove');
        }

        // Remove a small amount (5%) of available liquidity for WETH
        // Using a smaller percentage since WETH has higher value
        const amountToRemove = (Number(userLiquidity.availableAmount) * 0.05).toFixed(18);
        console.log('\nRemoval Details:');
        console.log('---------------');
        console.log(`Amount to Remove: ${Number(amountToRemove).toLocaleString()} ALP`);
        console.log('Token Out: WETH');
        console.log('Slippage Tolerance: 1.0%');

        const result = await removeLiquidity(
            {
                chainName: 'sonic',
                account: account.address as Address,
                tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
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

        if (result.success) {
            const details = JSON.parse(result.data);
            console.log('\nRemoval Result:');
            console.log('---------------');
            console.log('Status: ✅ Success');
            console.log('Transaction Hash:', details.hash);
            console.log('Removed Amount:', Number(details.details.amount).toLocaleString(), 'ALP');
            console.log('Token Out:', details.details.tokenOut);
            console.log('Min Out:', formatUnits(BigInt(details.details.minOut), 18), 'WETH');

            // Additional WETH-specific information
            console.log('\nWETH Details:');
            console.log('-------------');
            console.log('WETH Address:', CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH);
            console.log('Expected Min WETH:', Number(formatUnits(BigInt(details.details.minOut), 18)).toLocaleString(), 'WETH');
        } else {
            console.error('\nFailed to remove liquidity:', result.data);
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
