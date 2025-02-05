import { marketSwap } from '../../functions/trading/swaps/marketSwap.js';
import { NETWORKS, RPC_URLS } from '../../constants.js';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TransactionReturn } from '@heyanon/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'projects/amped/.env' });

// Define chain configuration
const sonicChain = {
    id: 146,
    name: 'Sonic',
    network: 'sonic',
    nativeCurrency: {
        name: 'Sonic',
        symbol: 'S',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: [RPC_URLS[NETWORKS.SONIC]] },
        public: { http: [RPC_URLS[NETWORKS.SONIC]] },
    },
};

async function main() {
    // Check command line arguments
    const [,, tokenIn, tokenOut, amount] = process.argv;
    if (!tokenIn || !tokenOut || !amount) {
        console.error('Usage: npx tsx test-market-swap.ts <tokenIn> <tokenOut> <amount>');
        console.error('Example: npx tsx test-market-swap.ts S ANON 0.1');
        process.exit(1);
    }

    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error('PRIVATE_KEY not found in environment');
        process.exit(1);
    }

    // Create account and clients
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const publicClient = createPublicClient({
        chain: sonicChain,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: sonicChain,
        transport: http(),
    });

    console.log(`\nTesting market swap from ${tokenIn} to ${tokenOut}...`);
    console.log('Amount:', amount);
    console.log('Account:', account.address);

    try {
        const result = await marketSwap(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                tokenIn: tokenIn as any,
                tokenOut: tokenOut as any,
                amountIn: amount,
                slippageBps: 500, // 5% slippage tolerance
            },
            {
                getProvider: () => publicClient,
                notify: async (msg: string) => console.log(msg),
                sendTransactions: async ({ transactions }): Promise<TransactionReturn> => {
                    const hashes = [];
                    for (const tx of transactions) {
                        console.log('\nSending transaction:');
                        console.log('To:', tx.target);
                        console.log('Value:', tx.value?.toString() || '0');
                        console.log('Data:', tx.data);

                        const hash = await walletClient.sendTransaction({
                            to: tx.target,
                            value: tx.value || 0n,
                            data: tx.data,
                        });

                        console.log('Transaction hash:', hash);
                        hashes.push({ hash, message: 'Transaction sent' });

                        // Wait for transaction receipt
                        const receipt = await publicClient.waitForTransactionReceipt({ hash });
                        console.log('Transaction confirmed in block:', receipt.blockNumber);
                    }
                    return {
                        data: hashes,
                        isMultisig: false,
                    };
                },
            },
        );

        if (result.success) {
            console.log('\nSwap Result:');
            console.log(JSON.stringify(JSON.parse(result.data), null, 2));
        } else {
            console.error('Error:', result.data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);
