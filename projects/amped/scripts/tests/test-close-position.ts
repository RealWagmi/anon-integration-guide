import { closePosition } from '../../functions/trading/leverage/closePosition.js';
import { getAllOpenPositions, OpenPosition } from '../../functions/trading/leverage/getPositions.js';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { FunctionOptions, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

const TEST_WALLET = '0xb51e46987fB2AAB2f94FD96BfE5d8205303D9C17';

async function testClosePosition() {
  console.log('Using wallet address:', TEST_WALLET);

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create account from private key
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // Create provider for checking positions
  const publicClient = createPublicClient({
    chain: {
      id: 146,
      name: 'Sonic',
      network: 'sonic',
      nativeCurrency: {
        name: 'S',
        symbol: 'S',
        decimals: 18,
      },
      rpcUrls: {
        default: { http: [RPC_URLS[NETWORKS.SONIC]] },
      }
    },
    transport: http()
  });

  // Create wallet client for sending transactions
  const walletClient = createWalletClient({
    account,
    chain: publicClient.chain,
    transport: http()
  });

  // Create options for function calls
  const options: FunctionOptions = {
    getProvider: () => publicClient,
    notify: async (msg: string) => console.log(msg),
    sendTransactions: async ({ transactions }: SendTransactionProps): Promise<TransactionReturn> => {
      console.log('\nExecuting transactions...');
      const results = [];
      
      for (const tx of transactions) {
        console.log(`\nSending transaction to ${tx.target}...`);
        try {
          const hash = await walletClient.sendTransaction({
            to: tx.target as `0x${string}`,
            data: tx.data as `0x${string}`,
            value: tx.value || 0n,
            chain: publicClient.chain
          });
          console.log('Transaction hash:', hash);
          results.push({
            message: 'Transaction sent successfully',
            hash: hash as `0x${string}`
          });
        } catch (error) {
          console.error('Transaction failed:', error);
          throw error;
        }
      }
      
      return {
        data: results,
        isMultisig: false
      };
    }
  };

  // Get all open long positions
  const positionsResult = await getAllOpenPositions({
    chainName: 'sonic',
    account: TEST_WALLET as `0x${string}`,
    isLong: true
  }, options);

  const positionsData = JSON.parse(positionsResult.data);
  if (!positionsData.success || !positionsData.positions) {
    console.log('Failed to get positions');
    return;
  }

  if (positionsData.positions.length === 0) {
    return;
  }

  // Find and close the ANON position
  const anonPosition = positionsData.positions.find((pos: OpenPosition) =>
    pos.indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON &&
    pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
  );

  if (!anonPosition) {
    console.log('\nNo ANON position found to close');
    return;
  }

  console.log('\nClosing ANON position...');
  const result = await closePosition({
    chainName: 'sonic',
    account: TEST_WALLET as `0x${string}`,
    indexToken: anonPosition.indexToken,
    collateralToken: anonPosition.collateralToken,
    isLong: true,
    slippageBps: 50, // 0.5% slippage (matches sample transaction)
    executionFee: BigInt('1000000000000000'), // 0.001 S
    withdrawETH: false, // Sample transaction doesn't withdraw as ETH
  }, options);

  console.log('\nTransaction submitted successfully!');
  console.log('Response:', result.data);
}

// Run the test
testClosePosition().catch(console.error); 