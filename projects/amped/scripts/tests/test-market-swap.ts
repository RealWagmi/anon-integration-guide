import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { marketSwap } from '../../functions/trading/swaps/marketSwap.js';
import { TransactionReturn } from '@heyanon/sdk';
import 'dotenv/config';

type TokenSymbol = 'S' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

// Parse command line arguments
const args = process.argv.slice(2);
const tokenIn = (args.find((arg) => arg.startsWith('--tokenIn='))?.split('=')[1] || 'S') as TokenSymbol;
const tokenOut = (args.find((arg) => arg.startsWith('--tokenOut='))?.split('=')[1] || 'ANON') as TokenSymbol;
const amountIn = args.find((arg) => arg.startsWith('--amountIn='))?.split('=')[1] || '1.0';
const slippageBps = Number(args.find((arg) => arg.startsWith('--slippageBps='))?.split('=')[1] || '100');

// Load private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env file');
}

// Ensure private key is properly formatted
const formattedPrivateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

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
    try {
        // Create clients
        const publicClient = createPublicClient({
            chain: sonicChain,
            transport: http(),
        });

        const walletClient = createWalletClient({
            account,
            chain: sonicChain,
            transport: http(),
        });

        console.log('\nTesting live market swap...');
        console.log('Wallet address:', account.address);
        console.log('Swap details:');
        console.log(`- Token In: ${tokenIn}`);
        console.log(`- Token Out: ${tokenOut}`);
        console.log(`- Amount In: ${amountIn} ${tokenIn}`);
        console.log(`- Slippage: ${slippageBps / 100}%`);

        const result = await marketSwap(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                tokenIn,
                tokenOut,
                amountIn,
                slippageBps,
            },
            {
                getProvider: () => publicClient,
                notify: async (msg: string) => console.log(msg),
                sendTransactions: async ({ transactions }) => {
                    const results = [];

                    for (const tx of transactions) {
                        console.log('\nSending transaction:');
                        console.log('To:', tx.target);
                        console.log('Value:', tx.value?.toString() || '0');

                        // Send transaction
                        const hash = await walletClient.sendTransaction({
                            to: tx.target,
                            data: tx.data,
                            value: tx.value ?? 0n,
                            account: walletClient.account,
                        });

                        console.log('Transaction hash:', hash);

                        // Wait for transaction receipt
                        const receipt = await publicClient.waitForTransactionReceipt({ hash });
                        console.log('Transaction confirmed in block:', receipt.blockNumber.toString());

                        results.push({
                            hash,
                            message: 'Transaction confirmed',
                        });
                    }

                    return {
                        data: results,
                        isMultisig: false,
                    } as TransactionReturn;
                },
            },
        );

        if (result.success) {
            const swapResult = JSON.parse(result.data);
            console.log('\nSwap Result:');
            console.log(JSON.stringify(swapResult, null, 2));
        } else {
            console.error('\nSwap failed:', result.data);
        }
    } catch (error) {
        console.error('\nUnexpected error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

main().catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
