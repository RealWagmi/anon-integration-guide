import { getEarnings } from '../../functions/liquidity/getEarnings.js';
import { getUserLiquidity } from '../../functions/liquidity/getUserLiquidity.js';
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

    console.log('\nChecking user liquidity status...');
    const liquidityResult = await getUserLiquidity(
        {
            chainName: 'sonic',
            account: account.address
        },
        options
    );

    if (!liquidityResult.success) {
        console.log('Error getting liquidity:', liquidityResult.data);
    } else {
        const liquidityInfo = JSON.parse(liquidityResult.data);
        console.log('\nLiquidity Information:');
        console.log('----------------------');
        console.log(`Total fsALP Balance: ${liquidityInfo.balance} fsALP`);
        console.log(`Total USD Value: $${liquidityInfo.usdValue}`);
        console.log(`ALP Price: $${liquidityInfo.alpPrice}`);
        console.log(`\nAvailable ALP: ${liquidityInfo.availableAmount} ALP ($${liquidityInfo.availableUsdValue})`);
        console.log(`Reserved ALP: ${liquidityInfo.reservedAmount} ALP ($${liquidityInfo.reservedUsdValue})`);
    }

    console.log('\nChecking earnings status...');
    const earningsResult = await getEarnings(
        {
            chainName: 'sonic',
            account: account.address
        },
        options
    );

    if (!earningsResult.success) {
        console.log('Error getting earnings:', earningsResult.data);
    } else {
        const earningsInfo = JSON.parse(earningsResult.data);
        console.log('\nEarnings Information:');
        console.log('--------------------');
        console.log(`Staked Amount: ${formatUnits(BigInt(earningsInfo.stakedAmount), 18)} tokens`);
        console.log(`Claimable Rewards: ${formatUnits(BigInt(earningsInfo.claimableRewards), 18)} wS`);
        console.log(`Reward Token Price: $${formatUnits(BigInt(earningsInfo.rewardTokenPriceUsd), 30)}`);
        console.log(`Total Reward Value: $${formatUnits(BigInt(earningsInfo.rewardValueUsd), 18)}`);
    }
}

test().catch(console.error); 