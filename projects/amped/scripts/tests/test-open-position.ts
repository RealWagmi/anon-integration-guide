import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { openPosition } from '../../functions/trading/leverage/openPosition.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Preparing to open long position on S token...');
  
  // Create public client
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  // Get wallet address from private key
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in environment variables');
  }
  
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? 
    process.env.PRIVATE_KEY as `0x${string}` : 
    `0x${process.env.PRIVATE_KEY}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });
  
  console.log('Using wallet address:', account.address);
  
  // Open a long position
  const result = await openPosition(publicClient, walletClient, {
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN as `0x${string}`, // S token (native token) as the index token
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON as `0x${string}`, // ANON as collateral
    isLong: true,
    sizeUsd: 50, // $50 position
    collateralUsd: 10, // $10 collateral (5x leverage)
  }, account);

  if (result.success) {
    console.log('\nPosition opened successfully!');
    console.log('Transaction hash:', result.hash);
  } else {
    console.error('\nFailed to open position:', result.error);
  }
}

main().catch(console.error); 
