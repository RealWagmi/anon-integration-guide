import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants';
import { getAllTokenLeverageLiquidity } from './functions/trading/leverage/getLiquidity';

async function test() {
  try {
    console.log('=== Starting liquidity test ===');
    console.log('RPC URL:', RPC_URLS[NETWORKS.SONIC]);
    console.log('Vault address:', CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT);

    // Create provider with network configuration
    console.log('\nCreating provider...');
    const provider = new ethers.providers.JsonRpcProvider(
      RPC_URLS[NETWORKS.SONIC],
      {
        name: 'sonic',
        chainId: 146
      }
    );

    // Test basic provider connection
    console.log('\nTesting provider connection...');
    const network = await provider.getNetwork();
    console.log('Connected to network:', {
      name: network.name,
      chainId: network.chainId
    });

    // List of tokens to check
    const tokens = {
      'WETH': CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      'USDC': CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      'EURC': CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC,
      'ANON': CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
      'S': CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
    };

    // Test edge cases
    const edgeCases = {
      'UnsupportedToken': '0x000000000000000000000000000000000000dead'
    };

    // Check liquidity for each token
    for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
      console.log(`\n=== Checking leverage liquidity for ${tokenName} ===`);
      console.log('Token:', tokenAddress);
      
      try {
        const results = await getAllTokenLeverageLiquidity(
          provider,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
          tokenAddress,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
        );

        console.log('\nRaw results:');
        console.log(JSON.stringify(results, null, 2));

        if (results.withUSDC?.long) {
          console.log('\nLong position with USDC:');
          console.log('Max leverage:', results.withUSDC.long.maxLeverage);
          console.log('Pool amount:', results.withUSDC.long.poolAmount);
          console.log('Reserved amount:', results.withUSDC.long.reservedAmount);
          console.log('Available liquidity:', results.withUSDC.long.availableLiquidity);
          console.log('Funding rate:', results.withUSDC.long.fundingRate);
        }

        if (results.withUSDC?.short) {
          console.log('\nShort position with USDC:');
          console.log('Max leverage:', results.withUSDC.short.maxLeverage);
          console.log('Pool amount:', results.withUSDC.short.poolAmount);
          console.log('Reserved amount:', results.withUSDC.short.reservedAmount);
          console.log('Available liquidity:', results.withUSDC.short.availableLiquidity);
          console.log('Funding rate:', results.withUSDC.short.fundingRate);
        }

      } catch (error) {
        console.error(`Failed for ${tokenName}:`, error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error);
        continue;
      }
    }

  } catch (e) {
    console.error('\n=== Test failed ===');
    console.error('Error details:', e instanceof Error ? {
      message: e.message,
      name: e.name,
      stack: e.stack
    } : e);
    throw e;
  }
}

test().catch(error => {
  console.error('\n=== Uncaught error ===');
  console.error('Error:', error instanceof Error ? {
    message: error.message,
    name: error.name,
    stack: error.stack
  } : error);
  process.exit(1);
}); 