import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { getEarnings } from '../../functions/liquidity/getEarnings.js';
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

        console.log('\nTesting get earnings...');
        console.log('Wallet address:', account.address);

        const result = await getEarnings(
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
            console.log('\nEarnings Information:');
            console.log('--------------------');
            console.log(`Staked Amount: ${formatUnits(BigInt(data.stakedAmount), 18)} tokens`);
            console.log(`Claimable Rewards: ${formatUnits(BigInt(data.claimableRewards), 18)} wS`);
            console.log(`Reward Token Price: $${formatUnits(BigInt(data.rewardTokenPriceUsd), 30)}`);
            console.log(`Total Reward Value: $${formatUnits(BigInt(data.rewardValueUsd), 18)}`);
        } else {
            console.error('\nFailed to get earnings:', result.data);
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
