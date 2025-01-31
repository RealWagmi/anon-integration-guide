import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { openPosition } from '../../functions/trading/leverage/openPosition.js';
import { FunctionOptions, TransactionReturn, SendTransactionProps } from '@heyanon/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

  // Test parameters
  const testParams = {
    chainName: 'sonic',
    account: account.address,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    isLong: true,
    sizeUsd: 50, // $50 position
    collateralUsd: 10, // $10 collateral (5x leverage)
    slippageBps: 30 // 0.3% slippage
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
    console.log('\nAttempting to open position...');
    const result = await openPosition(testParams, options);
    
    try {
      const response = JSON.parse(result.data);
      if (response.success === false) {
        console.log('Failed to open position:', response.error || result.data);
      } else {
        console.log('\nPosition opened successfully!');
        console.log('Transaction hash:', response.hash);
        console.log('Position details:', response.details);

        // Wait for transaction receipt
        console.log('\nWaiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: response.hash as `0x${string}`
        });
        console.log('Transaction confirmed in block:', receipt.blockNumber);
      }
    } catch (error) {
      console.log('Failed to parse response:', result.data);
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

main().catch(console.error); 