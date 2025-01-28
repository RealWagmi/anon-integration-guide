import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants';
import { getAllTokenLeverageLiquidity } from './functions/trading/leverage/getLiquidity';

async function test() {
  try {
    console.log('=== Starting liquidity test ===');
    console.log('RPC URL:', RPC_URLS[NETWORKS.SONIC]);
    console.log('Vault address:', CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT);

    console.log('\nCreating provider...');
    const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);

    // Test basic provider connection
    console.log('\nTesting provider connection...');
    const network = await provider.getNetwork();
    console.log('Connected to network:', {
      name: network.name,
      chainId: network.chainId
    });

    // Test each token
    const tokens = {
      'WETH': CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      'USDC': CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      'EURC': CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC,
      'ANON': CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
      'S': CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
    };

    for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
      console.log(`\n=== Checking ${tokenName} ===`);
      console.log('Token:', tokenAddress);

      try {
        const results = await getAllTokenLeverageLiquidity(
          provider,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
          tokenAddress,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
          CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
        );

        if (results.withUSDC) {
          console.log('\nWith USDC as collateral:');
          if (results.withUSDC.long) {
            console.log('\nLong positions:');
            console.log('Max leverage:', results.withUSDC.long.maxLeverage);
            console.log('Max position size:', results.withUSDC.long.maxPositionSize);
            console.log('Max collateral:', results.withUSDC.long.maxCollateral);
            console.log('Pool amount:', results.withUSDC.long.poolAmount);
            console.log('Reserved amount:', results.withUSDC.long.reservedAmount);
            console.log('Available liquidity:', results.withUSDC.long.availableLiquidity);
            console.log('Funding rate:', results.withUSDC.long.fundingRate);
          }
          if (results.withUSDC.short) {
            console.log('\nShort positions:');
            console.log('Max leverage:', results.withUSDC.short.maxLeverage);
            console.log('Max position size:', results.withUSDC.short.maxPositionSize);
            console.log('Max collateral:', results.withUSDC.short.maxCollateral);
            console.log('Pool amount:', results.withUSDC.short.poolAmount);
            console.log('Reserved amount:', results.withUSDC.short.reservedAmount);
            console.log('Available liquidity:', results.withUSDC.short.availableLiquidity);
            console.log('Funding rate:', results.withUSDC.short.fundingRate);
          }
        }

        if (results.withNativeToken) {
          console.log('\nWith native token as collateral:');
          if (results.withNativeToken.long) {
            console.log('\nLong positions:');
            console.log('Max leverage:', results.withNativeToken.long.maxLeverage);
            console.log('Max position size:', results.withNativeToken.long.maxPositionSize);
            console.log('Max collateral:', results.withNativeToken.long.maxCollateral);
            console.log('Pool amount:', results.withNativeToken.long.poolAmount);
            console.log('Reserved amount:', results.withNativeToken.long.reservedAmount);
            console.log('Available liquidity:', results.withNativeToken.long.availableLiquidity);
            console.log('Funding rate:', results.withNativeToken.long.fundingRate);
          }
          if (results.withNativeToken.short) {
            console.log('\nShort positions:');
            console.log('Max leverage:', results.withNativeToken.short.maxLeverage);
            console.log('Max position size:', results.withNativeToken.short.maxPositionSize);
            console.log('Max collateral:', results.withNativeToken.short.maxCollateral);
            console.log('Pool amount:', results.withNativeToken.short.poolAmount);
            console.log('Reserved amount:', results.withNativeToken.short.reservedAmount);
            console.log('Available liquidity:', results.withNativeToken.short.availableLiquidity);
            console.log('Funding rate:', results.withNativeToken.short.fundingRate);
          }
        }

      } catch (error) {
        console.error('Error checking token:', error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error);
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