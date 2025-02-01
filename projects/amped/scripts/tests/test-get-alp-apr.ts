import { getALPAPR } from '../../functions/liquidity/getALPAPR.js';
import { PublicClient, createPublicClient, http, Chain, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionOptions } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
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
} as const satisfies Chain;

async function test() {
    // Check for private key in environment
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account from private key
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using wallet address:', account.address);

    const provider = createPublicClient({
        chain: sonic,
        transport: http('https://rpc.soniclabs.com')
    });

    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (chainId: number): PublicClient => {
            if (chainId !== 146) throw new Error('Invalid chain ID');
            return provider;
        },
        sendTransactions: async () => ({ data: [], isMultisig: false })
    };

    console.log('\nChecking ALP APR information...');
    const aprResult = await getALPAPR(
        {
            chainName: 'sonic',
            account: account.address
        },
        options
    );

    if (!aprResult.success) {
        console.log('Error getting APR:', aprResult.data);
    } else {
        const aprInfo = JSON.parse(aprResult.data);
        console.log('\nALP APR Information:');
        console.log('-------------------');
        console.log(`Base APR: ${aprInfo.baseApr}%`);
        console.log(`\nReward Details:`);
        console.log(`Total Supply: ${formatUnits(BigInt(aprInfo.totalSupply), 18)} ALP`);
        console.log(`Yearly Rewards: ${formatUnits(BigInt(aprInfo.yearlyRewards), 18)} wS`);
        console.log(`Tokens Per Interval: ${formatUnits(BigInt(aprInfo.tokensPerInterval), 18)} wS/second`);

        // Calculate daily and weekly rewards for better understanding
        const dailyRewards = BigInt(aprInfo.yearlyRewards) / BigInt(365);
        const weeklyRewards = BigInt(aprInfo.yearlyRewards) / BigInt(52);
        
        console.log(`\nEstimated Rewards (if total supply remains constant):`);
        console.log(`Daily Rewards: ${formatUnits(dailyRewards, 18)} wS`);
        console.log(`Weekly Rewards: ${formatUnits(weeklyRewards, 18)} wS`);
    }
}

test().catch(console.error); 