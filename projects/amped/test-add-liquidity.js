import { addLiquidity } from './functions/liquidity/addLiquidity.js';
import { ethers } from 'ethers';

async function test() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.soniclabs.com');
  
  // For testing, we'll just log the transactions
  const params = {
    chainName: 'sonic',
    account: '0x1234567890123456789012345678901234567890', // Example address
    tokenIn: '0x0000000000000000000000000000000000000000', // Native token
    amount: '0.1', // 0.1 native token
  };

  const callbacks = {
    sendTransactions: async ({ transactions }) => {
      console.log('Transactions to send:', JSON.stringify(transactions, null, 2));
      return { success: true, message: 'Test mode - not sending', data: [], isMultisig: false };
    },
    notify: async (msg) => console.log('Notification:', msg),
    getProvider: () => provider
  };

  try {
    const result = await addLiquidity(params, callbacks);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 