import { createPublicClient, createWalletClient, http, parseEther, Address } from 'viem';
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
        public: { http: ['https://rpc.soniclabs.com'] }
    },
    blockExplorers: {
        default: { name: 'SonicScan', url: 'https://explorer.sonic.oasys.games' }
    }
} as const;

async function test() {
    // Check for private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account and clients
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Using wallet address:', account.address);

    const transport = http('https://rpc.soniclabs.com');
    const publicClient = createPublicClient({
        chain: sonic,
        transport
    });

    const walletClient = createWalletClient({
        chain: sonic,
        transport
    });

    // First get user's current liquidity
    const userLiquidityResult = await getUserLiquidity(
        { chainName: 'sonic', account: account.address as Address },
        {
            getProvider: (_chainId: number) => publicClient,
            notify: async (msg: string) => console.log(msg),
            sendTransactions: async () => { throw new Error('Should not be called'); }
        }
    );

    if (!userLiquidityResult.success) {
        throw new Error(`Failed to get user liquidity: ${userLiquidityResult.data}`);
    }

    const userLiquidity = JSON.parse(userLiquidityResult.data);
    console.log('\nCurrent user liquidity:', userLiquidity);

    if (Number(userLiquidity.availableAmount) === 0) {
        throw new Error('No liquidity available to remove');
    }

    // Remove a small amount (10%) of available liquidity in native token
    const amountToRemove = (Number(userLiquidity.availableAmount) * 0.1).toFixed(18);
    console.log(`\nAttempting to remove ${amountToRemove} ALP for native token (S)...`);

    try {
        const result = await removeLiquidity(
            {
                chainName: 'sonic',
                account: account.address as Address,
                tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                amount: amountToRemove,
                slippageTolerance: 1.0 // 1% slippage tolerance
            },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log(msg),
                sendTransactions: async ({ transactions }) => {
                    const [tx] = transactions;
                    const hash = await walletClient.sendTransaction({
                        account,
                        to: tx.target,
                        data: tx.data,
                        chain: sonic
                    });
                    console.log('Transaction hash:', hash);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    return { 
                        success: true, 
                        data: [{ 
                            hash,
                            message: 'Transaction submitted successfully'
                        }],
                        isMultisig: false 
                    };
                }
            }
        );

        if (result.success) {
            const details = JSON.parse(result.data);
            console.log('\nTransaction successful!');
            console.log('Transaction hash:', details.hash);
            console.log('Removed amount:', details.details.amount, 'ALP');
            console.log('Token out:', details.details.tokenOut);
            console.log('Min out:', details.details.minOut);
        } else {
            console.error('Failed to remove liquidity:', result.data);
        }
    } catch (error) {
        console.error('Error removing liquidity:', error);
    }
}

test().catch(console.error); 