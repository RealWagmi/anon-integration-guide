import { createPublicClient, createWalletClient, http, Chain, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity, SupportedToken } from '../../functions/liquidity/addLiquidity.js';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import 'dotenv/config';

// Define Sonic chain
const sonic = {
    id: 146,
    name: 'Sonic',
    network: 'sonic',
    nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'S',
    },
    rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] },
    },
} as const satisfies Chain;

interface TestParams {
    token?: SupportedToken; // Changed from tokenAddress to token
    amount?: string; // Optional: defaults to 25% of balance if not provided
    percentOfBalance?: number; // Optional: used if amount not provided, defaults to 25
}

async function test(params: TestParams = {}) {
    const { token = 'WETH', amount, percentOfBalance } = params;

    console.log('\nTesting add liquidity...');

    // Check for private key
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account and clients
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
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
        const result = await addLiquidity(
            {
                chainName: 'sonic',
                account: account.address,
                tokenSymbol: token,
                amount,
                percentOfBalance,
            },
            {
                getProvider: () => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async ({ transactions }) => {
                    const txResults = [];

                    for (const tx of transactions) {
                        console.log('\nTransaction Details:');
                        console.log('-------------------');
                        console.log('To:', tx.target);
                        console.log('Value:', (tx.value ?? 0n).toString());
                        console.log('Data:', tx.data);

                        const hash = await walletClient.sendTransaction({
                            chain: sonic,
                            to: tx.target,
                            value: tx.value || 0n,
                            data: tx.data as `0x${string}`,
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

                        txResults.push({
                            hash,
                            message: 'Transaction submitted successfully',
                        });
                    }

                    return {
                        isMultisig: false,
                        data: txResults,
                    };
                },
            },
        );

        if (result.success) {
            const response = JSON.parse(result.data);
            console.log('\nLiquidity Addition Result:');
            console.log('------------------------');
            console.log('Status: ✅ Success');
            console.log('Transaction Hash:', response.transactionHash);
            console.log(`Amount Added: ${response.details.amount} ${response.details.tokenSymbol}`);
            console.log(`USD Value: $${response.details.amountUsd}`);
            console.log(`Price Impact: ${Number(response.details.priceImpact)}%`);
            if (Number(response.details.priceImpact) > 1) {
                console.log('\n⚠️  Warning: High price impact detected!');
            }
        } else {
            console.error('\nFailed to add liquidity:', result.data);
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

// Parse command line arguments
const args = process.argv.slice(2);
const params: TestParams = {};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
        case '--token':
            if (!nextArg) throw new Error('--token requires a symbol');
            params.token = nextArg as SupportedToken;
            i++;
            break;
        case '--amount':
            if (!nextArg) throw new Error('--amount requires a value');
            params.amount = nextArg;
            i++;
            break;
        case '--percent':
            if (!nextArg) throw new Error('--percent requires a value');
            params.percentOfBalance = Number(nextArg);
            if (isNaN(params.percentOfBalance)) throw new Error('--percent must be a number');
            i++;
            break;
        default:
            throw new Error(`Unknown argument: ${arg}`);
    }
}

test(params).catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
