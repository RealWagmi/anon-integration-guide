import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { getUserLiquidity } from '../../functions/liquidity/getUserLiquidity.js';
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

        console.log('\nTesting get user liquidity...');
        console.log('Wallet address:', account.address);

        const result = await getUserLiquidity(
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
            console.log('\nUser Liquidity Information:');
            console.log('-------------------------');
            console.log(`Total fsALP Balance: ${data.balance} fsALP`);
            console.log(`Total USD Value: $${data.usdValue}`);
            console.log(`Current ALP Price: $${data.alpPrice}`);
            console.log('\nVesting Details:');
            console.log(`Reserved Amount: ${data.reservedAmount} fsALP ($${data.reservedUsdValue})`);
            console.log(`Available Amount: ${data.availableAmount} fsALP ($${data.availableUsdValue})`);
            if (data.claimableRewards !== '0') {
                console.log(`\nClaimable Rewards: ${data.claimableRewards}`);
            }
        } else {
            console.error('\nFailed to get user liquidity:', result.data);
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
