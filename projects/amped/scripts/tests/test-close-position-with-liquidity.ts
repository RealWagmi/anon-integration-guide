import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { closePosition } from '../../functions/trading/leverage/closePosition.js';
import { FunctionOptions, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import 'dotenv/config';

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create account from private key
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log('Using wallet address:', account.address);

  // Create clients
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  // Test parameters for closing an ANON position
  const testParams = {
    chainName: 'sonic',
    account: account.address,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    isLong: true,
    slippageBps: 30, // 0.3% slippage
    withdrawETH: true // withdraw as native token
  };

  // SDK options with real transaction handling
  const options: FunctionOptions = {
    getProvider: (chainId: number) => publicClient,
    notify: async (message: string) => console.log(message),
    sendTransactions: async (params: SendTransactionProps): Promise<TransactionReturn> => {
      console.log('\nSending transaction...');
      const { transactions } = params;
      const txHashes = [];

      for (const tx of transactions) {
        // Log transaction parameters for debugging
        console.log('\nTransaction Parameters:');
        console.log('To:', tx.target);
        console.log('Value:', tx.value?.toString());
        console.log('Data Length:', tx.data.length);
        console.log('Data:', tx.data);

        try {
          // Send the transaction
          const hash = await walletClient.sendTransaction({
            to: tx.target,
            value: tx.value || 0n,
            data: tx.data as `0x${string}`,
            chain: CHAIN_CONFIG[NETWORKS.SONIC],
            account
          });

          console.log('Transaction sent:', hash);
          txHashes.push({ hash, message: 'Transaction sent' });
        } catch (error) {
          console.error('Transaction failed:', error);
          throw error;
        }
      }

      return {
        isMultisig: false,
        data: txHashes
      };
    }
  };

  try {
    console.log('\nAttempting to close position...');
    const result = await closePosition(testParams, options);
    
    try {
      const response = JSON.parse(result.data);
      if (response.success === false) {
        console.log('Failed to close position:', response.error || result.data);
      } else {
        console.log('\nPosition close request submitted successfully!');
        console.log('Transaction hash:', response.hash);
        console.log('Position details:', response.details);

        // Wait for transaction receipt
        console.log('\nWaiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: response.hash as `0x${string}`
        });
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        console.log('\nIMPORTANT: The close position request must be executed by a keeper within:');
        console.log('- 2 blocks (~6 seconds)');
        console.log('- 180 seconds');
        console.log('Otherwise, the request will be cancelled and funds returned (minus gas fees).');
        console.log('\nYou can monitor the position status through the Sonic interface');
      }
    } catch (error) {
      console.log('Failed to parse response:', result.data);
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

main().catch(console.error); 