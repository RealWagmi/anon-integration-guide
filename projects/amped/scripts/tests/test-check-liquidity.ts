import { createPublicClient, http } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { Vault } from '../../abis/Vault.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

async function checkLiquidity(tokenAddress: string, tokenName: string, isLong: boolean, publicClient: any) {
  console.log(`\nChecking ${tokenName} liquidity for ${isLong ? 'long' : 'short'} positions...`);
  const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;
  const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;

  try {
    // Get pool amount and reserved amount
    const [poolAmount, reservedAmount] = await Promise.all([
      publicClient.readContract({
        address: vaultAddress,
        abi: Vault,
        functionName: 'poolAmounts',
        args: [tokenAddress]
      }),
      publicClient.readContract({
        address: vaultAddress,
        abi: Vault,
        functionName: 'reservedAmounts',
        args: [tokenAddress]
      })
    ]);

    // Get token price - use different parameters based on long/short
    const price = await publicClient.readContract({
      address: priceFeedAddress,
      abi: VaultPriceFeed,
      functionName: 'getPrice',
      args: [tokenAddress, isLong, true, true]
    });

    // Calculate available liquidity
    const availableLiquidity = poolAmount - reservedAmount;
    const priceInUsd = Number(price) / 1e30;
    
    // Handle different token decimals
    const decimals = tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase() ||
                    tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC.toLowerCase()
                    ? 6 : 18;
    
    const availableLiquidityNum = Number(availableLiquidity) / Math.pow(10, decimals);
    const availableLiquidityUsd = availableLiquidityNum * priceInUsd;

    // Calculate max leverage based on position type
    const maxLeverage = isLong ? 11 : 10;

    // Calculate max position size (80% of available liquidity to be conservative)
    const maxPositionSizeUsd = availableLiquidityUsd * 0.8;

    return {
      tokenName,
      positionType: isLong ? 'LONG' : 'SHORT',
      poolAmount: Number(poolAmount) / Math.pow(10, decimals),
      reservedAmount: Number(reservedAmount) / Math.pow(10, decimals),
      availableLiquidity: availableLiquidityNum,
      priceUsd: priceInUsd,
      availableLiquidityUsd,
      maxLeverage,
      maxPositionSizeUsd
    };
  } catch (error) {
    console.error(`Error checking ${tokenName} liquidity:`, error);
    return null;
  }
}

async function main() {
  console.log('Checking liquidity across tokens...');
  
  // Create public client
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  // Define tokens to check
  const longTokens = [
    { name: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN },
    { name: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { name: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH }
  ];

  const shortTokens = [
    { name: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC }
  ];

  if (CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC) {
    shortTokens.push({ name: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC });
  }

  // Check liquidity for each token
  const longResults = await Promise.all(
    longTokens.map(token => checkLiquidity(token.address, token.name, true, publicClient))
  );

  const shortResults = await Promise.all(
    shortTokens.map(token => checkLiquidity(token.address, token.name, false, publicClient))
  );

  // Filter out null results and sort by available liquidity in USD
  const validResults = [...longResults, ...shortResults].filter(result => result !== null);
  validResults.sort((a, b) => b!.availableLiquidityUsd - a!.availableLiquidityUsd);

  // Print results
  console.log('\nLiquidity Summary (sorted by USD value):');
  validResults.forEach(result => {
    console.log(`\n${result!.tokenName} (${result!.positionType}):`);
    console.log(`  Pool Amount: ${result!.poolAmount.toFixed(4)} ${result!.tokenName}`);
    console.log(`  Reserved Amount: ${result!.reservedAmount.toFixed(4)} ${result!.tokenName}`);
    console.log(`  Available: ${result!.availableLiquidity.toFixed(4)} ${result!.tokenName}`);
    console.log(`  Price: $${result!.priceUsd.toFixed(4)}`);
    console.log(`  Available in USD: $${result!.availableLiquidityUsd.toFixed(2)}`);
    console.log(`  Max Leverage: ${result!.maxLeverage}x`);
    console.log(`  Max Position Size: $${result!.maxPositionSizeUsd.toFixed(2)}`);
  });

  if (validResults.length > 0) {
    const bestLong = validResults.find(r => r!.positionType === 'LONG');
    const bestShort = validResults.find(r => r!.positionType === 'SHORT');

    console.log('\nBest tokens for liquidity:');
    if (bestLong) {
      console.log(`  LONG: ${bestLong.tokenName} ($${bestLong.availableLiquidityUsd.toFixed(2)} available, max position $${bestLong.maxPositionSizeUsd.toFixed(2)})`);
    }
    if (bestShort) {
      console.log(`  SHORT: ${bestShort.tokenName} ($${bestShort.availableLiquidityUsd.toFixed(2)} available, max position $${bestShort.maxPositionSizeUsd.toFixed(2)})`);
    }
  }
}

main().catch(console.error); 