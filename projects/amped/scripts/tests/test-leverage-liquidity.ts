import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants';
import { getAllTokenLeverageLiquidity } from './functions/trading/leverage/getLiquidity';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  // Create provider with corrected configuration
  const provider = new ethers.providers.JsonRpcProvider({
    url: RPC_URLS[NETWORKS.SONIC],
    timeout: 15000
  });

  // Group tokens by supported position types
  const longSupportedTokens = {
    'ANON': CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON.toLowerCase(),
    'S': CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase(),
    'WETH': CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH.toLowerCase(),
  };

  const shortSupportedTokens = {
    'USDC': CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase(),
    'EURC': CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC.toLowerCase(),
  };

  console.log('Provider URL:', RPC_URLS[NETWORKS.SONIC]);
  console.log('Vault Address:', CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT);

  // Check liquidity for long-supported tokens
  console.log('\n=== Checking leverage liquidity for Long-supported tokens ===');
  for (const [tokenName, tokenAddress] of Object.entries(longSupportedTokens)) {
    console.log(`\n--- ${tokenName} ---`);
    try {
      const results = await getAllTokenLeverageLiquidity(
        provider,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
        tokenAddress,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
      );

      console.log(JSON.stringify(results, null, 2));
      console.log(`Available Liquidity: ${results.withNativeToken?.long?.availableLiquidity || 'N/A'}`);
    } catch (error) {
      console.error(`Failed for ${tokenName}:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      continue;
    }
  }

  // Check liquidity for short-supported tokens
  console.log('\n=== Checking leverage liquidity for Short-supported tokens ===');
  for (const [tokenName, tokenAddress] of Object.entries(shortSupportedTokens)) {
    console.log(`\n--- ${tokenName} ---`);
    try {
      const results = await getAllTokenLeverageLiquidity(
        provider,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
        tokenAddress,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
      );

      console.log(JSON.stringify(results, null, 2));
      console.log(`Available Liquidity: ${results.withUSDC?.short?.availableLiquidity || 'N/A'}`);
    } catch (error) {
      console.error(`Failed for ${tokenName}:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      continue;
    }
  }
}

test().catch((error) => {
  console.error('Top level error:', error);
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
  }
  process.exit(1);
}); 