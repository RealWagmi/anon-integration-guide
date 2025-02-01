import { createPublicClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { getUserTokenBalances } from '../../functions/liquidity/getUserTokenBalances.js';
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

    // Create account and client
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Using wallet address:', account.address);

    const transport = http('https://rpc.soniclabs.com');
    const publicClient = createPublicClient({
        chain: sonic,
        transport
    });

    try {
        const result = await getUserTokenBalances(
            {
                chainName: 'sonic',
                account: account.address as Address
            },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log(msg),
                sendTransactions: async () => { throw new Error('Should not be called'); }
            }
        );

        if (result.success) {
            const data = JSON.parse(result.data);
            console.log('\nToken Balances:');
            console.log('---------------');
            
            // Display each token's balance and USD value
            data.tokens.forEach((token: any) => {
                const balance = Number(token.balance) / 10 ** token.decimals;
                const price = Number(token.price) / 1e30;  // Price is in 1e30
                const usdValue = Number(token.balanceUsd) / 1e18;  // USD value is in 1e18

                console.log(`\n${token.symbol}:`);
                console.log(`Balance: ${balance.toFixed(token.decimals === 6 ? 6 : 18)} ${token.symbol}`);
                console.log(`USD Value: $${usdValue.toFixed(2)}`);
                console.log(`Price: $${price.toFixed(6)}`);
            });

            // Display total USD value
            const totalUsd = Number(data.totalBalanceUsd) / 1e18;
            console.log('\nTotal USD Value:', `$${totalUsd.toFixed(2)}`);
        } else {
            console.error('Failed to get token balances:', result.data);
        }
    } catch (error) {
        console.error('Error getting token balances:', error);
    }
}

test().catch(console.error); 