import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionOptions, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import { openSPosition } from '../../functions/trading/leverage/openSPosition.js';
import { NETWORKS, RPC_URLS } from '../../constants.js';
import 'dotenv/config';

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create account from private key
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // Create public client
  const publicClient = createPublicClient({
    chain: {
      id: 146,
      name: 'Sonic',
      network: 'sonic',
      nativeCurrency: {
        name: 'Sonic',
        symbol: 'S',
        decimals: 18
      },
      rpcUrls: {
        default: { http: [RPC_URLS[NETWORKS.SONIC]] }
      }
    },
    transport: http()
  });

  // Create wallet client
  const walletClient = createWalletClient({
    chain: chains.sonic,
    transport: http()
  });

  try {
    const result = await openSPosition(
      {
        chainName: 'sonic',
        account: account.address,
        collateralValueUsd: 10, // $10 USD of collateral (minimum allowed)
        positionValueUsd: 11, // $11 USD total position size (1.1x leverage, minimum allowed)
      },
      {
        getProvider: () => publicClient,
        sendTransactions: async (props: SendTransactionProps): Promise<TransactionReturn> => {
          console.log('Transaction props:', props);
          // In a test environment, we just log the transactions
          return { success: true, message: 'Test mode - transactions logged' };
        },
        notify: async (message: string) => {
          console.log('Notification:', message);
        }
      }
    );

    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 
