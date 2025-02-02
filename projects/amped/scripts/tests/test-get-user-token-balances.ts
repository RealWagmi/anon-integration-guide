import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { getUserTokenBalances } from '../../functions/liquidity/getUserTokenBalances.js';
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

        console.log('\nTesting get user token balances...');
        console.log('Wallet address:', account.address);

        const result = await getUserTokenBalances(
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
            console.log('\nToken Balances:');
            console.log('---------------');

            // Display each token's balance and USD value
            data.tokens.forEach((token: { symbol: string; decimals: number; balance: string; price: string; balanceUsd: string }) => {
                const balance = Number(token.balance) / 10 ** token.decimals;
                const price = Number(token.price) / 1e30; // Price is in 1e30
                const usdValue = Number(token.balanceUsd);

                console.log(`\n${token.symbol}:`);
                console.log(`Balance: ${balance.toFixed(token.decimals === 6 ? 6 : 18)} ${token.symbol}`);
                console.log(`USD Value: $${usdValue.toFixed(2)}`);
                console.log(`Price: $${price.toFixed(6)}`);
            });

            // Display total USD value
            const totalUsd = Number(data.totalBalanceUsd);
            console.log('\nTotal USD Value:', `$${totalUsd.toFixed(2)}`);
        } else {
            console.error('\nFailed to get token balances:', result.data);
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
