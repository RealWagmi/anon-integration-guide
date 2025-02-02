import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from '../../constants.js';
import { getPoolLiquidity } from '../../functions/liquidity/getPoolLiquidity.js';
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

        console.log('\nTesting get pool liquidity...');

        const result = await getPoolLiquidity(
            {
                chainName: NETWORKS.SONIC,
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
            console.log('\nPool Overview:');
            console.log('-------------');
            console.log(`Total ALP Supply: ${Number(data.totalSupply).toLocaleString()} ALP`);
            console.log(`Total Value Locked: $${Number(data.aum).toLocaleString()}`);
            console.log(`ALP Price: $${Number(data.aumPerToken).toFixed(6)}`);

            console.log('\nToken Liquidity:');
            console.log('---------------');
            data.tokens.forEach((token: any) => {
                console.log(`\n${token.symbol}:`);
                console.log(`  Pool Amount: ${Number(token.poolAmount).toLocaleString()} ($${Number(token.poolAmountUsd).toLocaleString()})`);
                console.log(`  Reserved: ${Number(token.reservedAmount).toLocaleString()} ($${Number(token.reservedAmountUsd).toLocaleString()})`);
                console.log(`  Available: ${Number(token.availableAmount).toLocaleString()} ($${Number(token.availableAmountUsd).toLocaleString()})`);
                console.log(`  Price: $${Number(token.price).toFixed(6)}`);
            });

            console.log('\nRaw Data:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('\nFailed to get pool liquidity:', result.data);
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
