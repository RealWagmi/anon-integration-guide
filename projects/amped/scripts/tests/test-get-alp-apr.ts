import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { getALPAPR } from '../../functions/liquidity/getALPAPR.js';
import { TransactionReturn } from '@heyanon/sdk';
import 'dotenv/config';

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

        console.log('\nTesting get ALP APR...');
        console.log('Wallet address:', account.address);

        const result = await getALPAPR(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
            },
            {
                getProvider: () => publicClient,
                notify: async (msg: string) => console.log(msg),
                sendTransactions: async ({ transactions }): Promise<TransactionReturn> => {
                    throw new Error('This function should not require transactions');
                },
            },
        );

        if (result.success) {
            const data = JSON.parse(result.data);
            console.log('\nALP APR Information:');
            console.log('-------------------');
            console.log(`Base APR: ${Number(data.baseApr).toFixed(2)}%`);

            console.log('\nReward Details:');
            console.log(`Total Supply: ${Number(formatUnits(BigInt(data.totalSupply), 18)).toLocaleString()} ALP`);
            console.log(`Yearly Rewards: ${Number(formatUnits(BigInt(data.yearlyRewards), 18)).toLocaleString()} wS`);
            console.log(`Tokens Per Interval: ${formatUnits(BigInt(data.tokensPerInterval), 18)} wS/second`);

            // Calculate daily and weekly rewards for better understanding
            const dailyRewards = BigInt(data.yearlyRewards) / BigInt(365);
            const weeklyRewards = BigInt(data.yearlyRewards) / BigInt(52);

            console.log('\nEstimated Rewards (if total supply remains constant):');
            console.log(`Daily Rewards: ${Number(formatUnits(dailyRewards, 18)).toLocaleString()} wS`);
            console.log(`Weekly Rewards: ${Number(formatUnits(weeklyRewards, 18)).toLocaleString()} wS`);

            console.log('\nRaw Data:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('\nFailed to get ALP APR:', result.data);
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
