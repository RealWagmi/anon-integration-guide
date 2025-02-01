import { tokenBalances } from '../../functions/liquidity/tokenBalances.js';
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

    const transport = http('https://rpc.soniclabs.com');
    
    const provider = createPublicClient({
        chain: sonic,
        transport
    });

    const options: Pick<FunctionOptions, 'notify' | 'getProvider'> = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (chainId: number): PublicClient => {
            if (chainId !== 146) throw new Error('Invalid chain ID');
            return provider;
        }
    };

    console.log('\nFetching token balances...');
    const result = await tokenBalances(
        {
            chainName: 'sonic',
            account: account.address
        },
        options as FunctionOptions
    );

    if (!result.success) {
        console.log('Error getting token balances:', result.data);
        return;
    }

    const balanceInfo = JSON.parse(result.data);
    
    console.log('\nToken Balances:');
    console.log('---------------');
    for (const token of balanceInfo.tokens) {
        console.log(`${token.symbol}:`);
        console.log(`  Balance: ${formatUnits(BigInt(token.balance), token.decimals)}`);
        console.log(`  USD Value: $${formatUnits(BigInt(token.balanceUsd), 18)}`);
        console.log(`  Price: $${formatUnits(BigInt(token.price), 30)}`);
    }

    console.log('\nTotal Balance:');
    console.log(`$${formatUnits(BigInt(balanceInfo.totalBalanceUsd), 18)}`);
}

test().catch(console.error); 