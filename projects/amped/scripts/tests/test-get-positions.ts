import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { getPosition } from '../../functions/trading/leverage/getPositions.js';
import { FunctionOptions } from '@heyanon/sdk';
import 'dotenv/config';

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create account from private key
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log('Using wallet address:', account.address);

  // Create public client
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  // SDK options
  const options: FunctionOptions = {
    getProvider: (chainId: number) => publicClient,
    notify: async (message: string) => console.log(message),
    sendTransactions: async () => {
      throw new Error('sendTransactions not needed for getPosition');
      return { isMultisig: false, data: [] };
    }
  };

  // Define index tokens to check
  const indexTokens = [
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN },
    { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC },
    { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC }
  ];

  // Define possible collateral tokens
  const collateralTokens = [
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC }
  ];

  // Check positions for each index token
  for (const indexToken of indexTokens) {
    console.log(`\nChecking positions for ${indexToken.symbol} as index token:`);

    // Check long positions with each collateral
    console.log('\nLong positions:');
    for (const collateral of collateralTokens) {
      const longResult = await getPosition({
        chainName: 'sonic',
        account: account.address,
        indexToken: indexToken.address as `0x${string}`,
        collateralToken: collateral.address as `0x${string}`,
        isLong: true
      }, options);

      const longData = JSON.parse(longResult.data);
      if (longData.success && longData.position.size && longData.position.size !== '0') {
        console.log(`\nActive long position found with ${collateral.symbol} as collateral:`);
        console.log(JSON.stringify(longData.position, null, 2));
      }
    }

    // Check short positions with each collateral
    console.log('\nShort positions:');
    for (const collateral of collateralTokens) {
      const shortResult = await getPosition({
        chainName: 'sonic',
        account: account.address,
        indexToken: indexToken.address as `0x${string}`,
        collateralToken: collateral.address as `0x${string}`,
        isLong: false
      }, options);

      const shortData = JSON.parse(shortResult.data);
      if (shortData.success && shortData.position.size && shortData.position.size !== '0') {
        console.log(`\nActive short position found with ${collateral.symbol} as collateral:`);
        console.log(JSON.stringify(shortData.position, null, 2));
      }
    }
  }
}

main().catch(console.error); 
