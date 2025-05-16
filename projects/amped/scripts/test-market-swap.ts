#!/usr/bin/env tsx
/**
 * Test Market Swap Function
 * 
 * This script is designed specifically to test the marketSwap function 
 * with proper parameter passing.
 */

import dotenv from 'dotenv';
import { marketSwap } from '../src/functions/trading/swaps/marketSwap.js';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG } from '../src/constants.js';

// Load environment variables
dotenv.config();

// Get private key from environment variables
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('Error: PRIVATE_KEY not found in environment variables');
  process.exit(1);
}

async function main() {
  try {
    const chainName = "sonic";
    const chainConfig = CHAIN_CONFIG[chainName];
    
    // Create public client
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0])
    });

    // Create wallet client
    const account = privateKeyToAccount(`0x${privateKey}`);
    const walletClient = createWalletClient({
      account,
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0])
    });

    console.log(`Using account: ${account.address}`);
    
    // Function parameters
    const marketSwapProps = {
      chainName,
      account: account.address,
      tokenIn: 'USDC',
      tokenOut: 'ANON',
      amountIn: '1',
      slippageBps: 50,
      publicClient, // Include publicClient in props
      walletClient  // Include walletClient in props
    };
    
    // Create options object with all required functions
    const functionOptions = {
      notify: async (message: string) => {
        console.log(`[Notify] ${message}`);
      },
      getProvider: (chainId: number) => {
        return publicClient;
      },
      evm: {
        getProvider: (chainId: number) => {
          return publicClient;
        },
        sendTransactions: async (txs: any) => {
          console.log(`[SendTx] Would send ${txs.transactions?.length || 1} transactions in production`);
          return { 
            success: true, 
            data: [{
              hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
              wait: async () => ({ status: 'success' })
            }]
          };
        },
        signMessages: async (messages: any[]) => {
          console.log(`[SignMsg] Would sign ${messages.length} messages in production`);
          return messages.map(() => '0x0000000000000000000000000000000000000000000000000000000000000000');
        },
        signTypedDatas: async (args: any[]) => {
          console.log(`[SignTypedData] Would sign ${args.length} typed data in production`);
          return args.map(() => '0x0000000000000000000000000000000000000000000000000000000000000000');
        }
      },
      solana: {
        getConnection: () => {
          console.log(`[Solana] Would get connection in production`);
          return {} as any;
        },
        getPublicKey: async () => {
          console.log(`[Solana] Would get public key in production`);
          return {} as any;
        },
        sendTransactions: async () => {
          console.log(`[Solana] Would send transactions in production`);
          return { success: true, data: [] };
        },
        signTransactions: async () => {
          console.log(`[Solana] Would sign transactions in production`);
          return [];
        }
      },
      ton: {
        getAddress: async () => {
          console.log(`[TON] Would get address in production`);
          return {} as any;
        },
        getClient: async () => {
          console.log(`[TON] Would get client in production`);
          return {} as any;
        },
        sendTransactions: async () => {
          console.log(`[TON] Would send transactions in production`);
          return { success: true, data: [] };
        }
      },
      sendTransactions: async (txs: any) => {
        console.log(`[SendTx-Legacy] Would send ${txs.transactions?.length || 1} transactions in production`);
        return { 
          success: true, 
          data: [{
            hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            wait: async () => ({ status: 'success' })
          }]
        };
      },
      getRecipient: async (type: string) => {
        console.log(`[GetRecipient] Would get recipient for ${type} in production`);
        return account.address;
      }
    };
    
    console.log("--- Executing marketSwap ---");
    const result = await marketSwap(marketSwapProps, functionOptions);
    console.log("--- Execution Complete ---");
    
    console.log('\nResult:');
    if (result.success && typeof result.data === 'string') {
      try {
        const jsonData = JSON.parse(result.data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(result.data);
      }
    } else {
      console.log(result);
    }
    
  } catch (error) {
    console.error('\nError executing marketSwap:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 