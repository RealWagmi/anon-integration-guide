import { getSwapsLiquidity } from '../../functions/trading/swaps/getSwapsLiquidity.js';
import { NETWORKS, RPC_URLS } from '../../constants.js';
import { createPublicClient, http } from 'viem';
import { TransactionReturn } from '@heyanon/sdk';

async function main() {
    const testWallet = '0xb51e46987fB2AAB2f94FD96BfE5d8205303D9C17';

    console.log('\nChecking swaps liquidity...');
    console.log('Test wallet:', testWallet);

    const result = await getSwapsLiquidity(
        {
            chainName: NETWORKS.SONIC,
            account: testWallet as `0x${string}`,
        },
        {
            getProvider: () =>
                createPublicClient({
                    chain: {
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
                    },
                    transport: http(),
                }),
            notify: async (msg: string) => console.log(msg),
            sendTransactions: async (): Promise<TransactionReturn> => ({
                data: [
                    {
                        hash: '0x',
                        message: 'Mock transaction',
                    },
                ],
                isMultisig: false,
            }),
        },
    );

    if (result.success) {
        const liquidity = JSON.parse(result.data);
        console.log('\nLiquidity Details:');
        console.log(JSON.stringify(liquidity, null, 2));
    } else {
        console.error('Error:', result.data);
    }
}

main().catch(console.error);
