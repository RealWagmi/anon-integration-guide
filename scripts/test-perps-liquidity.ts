import { createPublicClient, http, getContract } from 'viem';
import { FunctionOptions } from '@heyanon/sdk';
import { getPerpsLiquidity } from '../functions/trading/leverage/getPerpsLiquidity';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../projects/amped/constants';
import { Vault } from '../projects/amped/abis/Vault';

async function main() {
  // Create public client
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  // Create SDK options
  const sdkOptions: FunctionOptions = {
    getProvider: () => publicClient,
    notify: async (message: string) => {
      console.log('Notification:', message);
    },
    sendTransactions: async () => {
      throw new Error('sendTransactions should not be called in this test');
    }
  };

  // Define tradeable tokens (index tokens)
  const indexTokens = {
    WETH: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    ANON: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    S: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
  };

  // Define collateral tokens for shorts
  const collateralTokens = {
    USDC: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    EURC: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC
  };

  try {
    // Test long positions for all index tokens
    for (const [tokenName, tokenAddress] of Object.entries(indexTokens)) {
      console.log(`\n=== Testing ${tokenName} long position liquidity ===`);
      const longResult = await getPerpsLiquidity(
        {
          chainName: 'sonic',
          account: '0x1234567890123456789012345678901234567890',
          indexToken: tokenAddress,
          collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, // Use USDC as collateral for longs
          isLong: true
        },
        sdkOptions
      );
      if (longResult.success) {
        console.log(`${tokenName} Long Result:`, JSON.parse(longResult.data));
      } else {
        console.log(`${tokenName} Long Error:`, longResult.data);
      }
    }

    // Test short positions for all index tokens with different collateral tokens
    for (const [tokenName, tokenAddress] of Object.entries(indexTokens)) {
      for (const [collateralName, collateralAddress] of Object.entries(collateralTokens)) {
        console.log(`\n=== Testing ${tokenName} short position liquidity with ${collateralName} collateral ===`);
        const shortResult = await getPerpsLiquidity(
          {
            chainName: 'sonic',
            account: '0x1234567890123456789012345678901234567890',
            indexToken: tokenAddress,
            collateralToken: collateralAddress,
            isLong: false
          },
          sdkOptions
        );
        if (shortResult.success) {
          console.log(`${tokenName} Short Result (${collateralName} collateral):`, JSON.parse(shortResult.data));
        } else {
          console.log(`${tokenName} Short Error (${collateralName} collateral):`, shortResult.data);
        }
      }
    }

    // Test error case - unsupported chain
    console.log('\n=== Testing unsupported chain error ===');
    const errorResult = await getPerpsLiquidity(
      {
        chainName: 'ethereum',
        account: '0x1234567890123456789012345678901234567890',
        indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
        collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
        isLong: true
      },
      sdkOptions
    );
    if (errorResult.success) {
      console.log('Error Test Result:', JSON.parse(errorResult.data));
    } else {
      console.log('Error Test (Expected):', errorResult.data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);