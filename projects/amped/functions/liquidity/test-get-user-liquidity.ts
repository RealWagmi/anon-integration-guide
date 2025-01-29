import { getUserLiquidity } from './getUserLiquidity.js';
import { PublicClient, createPublicClient, http, Chain } from 'viem';
import { FunctionOptions } from '@heyanon/sdk';

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
            account: '0xB1A9056a5921C0F6f2C68Ce19E08cA9A6D5FD904'
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
