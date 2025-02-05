import { marketSwap } from '../../functions/trading/swaps/marketSwap';
import { NETWORKS } from '../../constants';
import { createPublicClient, http } from 'viem';
import { sonic } from '../../chains';

async function testSwap() {
    try {
        // Create a proper viem public client
        const getProvider = () => createPublicClient({
            chain: sonic,
            transport: http()
        });

        const result = await marketSwap({
            chainName: NETWORKS.SONIC,
            account: '0x9D79e04cCE4d002E86f53eFB2A8F0F64f7D39008',  // Using the account from the example tx
            tokenIn: 'S',
            tokenOut: 'WS',
            amountIn: '2',  // Swapping 2 S to WS
        }, {
            notify: async (message: string) => {
                console.log(message);
                return Promise.resolve();
            },
            getProvider,
            sendTransactions: async (props) => {
                console.log('Would send transactions:', JSON.stringify(props, null, 2));
                return { success: true, data: '0xmocked_transaction_hash' };
            }
        });

        console.log('Swap result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

testSwap(); 