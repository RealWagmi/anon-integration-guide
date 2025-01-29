import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants.js';
import { getPosition, printPosition } from './functions/trading/leverage/getPositions.js';

async function checkPositions() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required in .env file');
  }

  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const account = await signer.getAddress();

  console.log('Checking positions for account:', account);

  // Define tokens to check
  const tokens = [
    { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC },
    { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC },
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN }
  ];

  // Check both long and short positions for each token
  for (const token of tokens) {
    console.log(`\nChecking positions for ${token.symbol}:`);
    
    // Check long position
    console.log('\nLong position:');
    await printPosition(
      provider,
      account,
      token.address,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      true
    );

    // Check short position
    console.log('\nShort position:');
    await printPosition(
      provider,
      account,
      token.address,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      false
    );
  }
}

// Run the check
checkPositions().catch(console.error); 