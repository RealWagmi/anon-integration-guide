import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { openPosition } from '../../functions/trading/leverage/openPosition.js';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from '../../chains.js';
import { TransactionReturn } from '@heyanon/sdk';
import 'dotenv/config';

// Opening a $22 long position on S using $20 of ANON as collateral (1.1x leverage)
const indexToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN; // Long S token
const collateralToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;    // Using ANON as collateral

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create viem clients
  const transport = http(RPC_URLS[NETWORKS.SONIC]);
  const publicClient = createPublicClient({
    chain: sonic,
    transport
  }) as PublicClient;

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: sonic,
    transport
  });

  try {
    const result = await openPosition(
      {
        chainName: 'sonic',
        account: account.address,
        indexToken,
        collateralToken,
        collateralValueUsd: 20,  // $20 USD of ANON as collateral
        positionValueUsd: 22,    // $22 USD total position size (1.1x leverage)
      },
      {
        getProvider: () => publicClient,
        notify: async (message) => console.log(message),
        sendTransactions: async ({ transactions }) => {
          const txResults = [];
          for (const tx of transactions) {
            const hash = await walletClient.sendTransaction({
              chain: sonic,
              to: tx.target,
              data: tx.data,
              value: tx.value || 0n
            });
            console.log('Transaction hash:', hash);
            txResults.push({
              hash,
              message: `Transaction hash: ${hash}`,
              status: 'success'
            });
          }
          return {
            isMultisig: false,
            data: txResults
          } as TransactionReturn;
        }
      }
    );
    console.log('Position opened successfully:', result);
  } catch (error) {
    console.error('Error opening position:', error);
  }
}

main().catch(console.error); 