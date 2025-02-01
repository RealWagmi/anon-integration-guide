import { getUserLiquidity } from '../../functions/liquidity/getUserLiquidity.js';
import { PublicClient, createPublicClient, http, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionOptions } from '@heyanon/sdk';
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

    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (chainId: number): PublicClient => {
            if (chainId !== 146) throw new Error('Invalid chain ID');
            return createPublicClient({
                chain: sonic,
                transport: http('https://rpc.soniclabs.com')
            });
        },
        sendTransactions: async () => ({ data: [], isMultisig: false })
    };

    const result = await getUserLiquidity(
        {
            chainName: 'sonic',
            account: account.address
        },
        options
    );

    if (!result.success) {
        console.log('Error:', result.data);
    } else {
        try {
            console.log('Result:', JSON.parse(result.data));
        } catch (e) {
            console.log('Raw result:', result.data);
        }
    }
}

test().catch(console.error); 