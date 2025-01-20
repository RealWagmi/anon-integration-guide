import { addLiquidity } from '../functions/liquidity/addLiquidity';
import { createWalletClient, custom } from 'viem';

async function testAddLiquidity() {
  // Mock window.ethereum for testing
  const mockEthereum = {
    // Add any ethereum methods needed for testing
    request: async () => {},
    // Add other required properties
  };

  const wallet = createWalletClient({
    chain: {
      id: 146,
      name: 'Sonic',
      network: 'sonic',
      nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'S',
      },
      rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] },
      },
    },
    transport: custom(mockEthereum) // Use mock instead of window.ethereum
  });

  const account = await wallet.getAddresses().then(addresses => addresses[0]);

  const props = {
    chainName: 'sonic',
    account,
    tokenIn: '0x0000000000000000000000000000000000000000', // The token address you want to add
    amount: '10', // Amount of tokens to add
    minOut: '2' // Minimum GLP to receive
  };

  const notify = async (message: string) => {
    console.log(message);
  };

  const sendTransactions = async (params: any) => {
    // Implement your transaction sending logic here
    // This should interact with your wallet
  };

  const result = await addLiquidity(props, {
    sendTransactions,
    notify
  });

  console.log('Result:', result);
}

testAddLiquidity().catch(console.error);