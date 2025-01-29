import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants.js';
import { Vault } from './abis/Vault.js';

async function checkLimits() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const vault = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT, Vault, provider);
  const tokens = [
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN }
  ];

  for (const token of tokens) {
    console.log(`\nChecking limits for ${token.symbol}:`);
    try {
      const [poolAmount, reservedAmount, maxLongSize, maxShortSize] = await Promise.all([
        vault.poolAmounts(token.address),
        vault.reservedAmounts(token.address),
        vault.maxGlobalLongSizes(token.address).catch(() => 'Not available'),
        vault.maxGlobalShortSizes(token.address).catch(() => 'Not available')
      ]);

      console.log('Pool Amount:', ethers.utils.formatUnits(poolAmount, 18));
      console.log('Reserved Amount:', ethers.utils.formatUnits(reservedAmount, 18));
      console.log('Max Global Long Size:', maxLongSize === 'Not available' ? maxLongSize : ethers.utils.formatUnits(maxLongSize, 30));
      console.log('Max Global Short Size:', maxShortSize === 'Not available' ? maxShortSize : ethers.utils.formatUnits(maxShortSize, 30));
      
      // Calculate available liquidity
      const availableLiquidity = poolAmount.sub(reservedAmount);
      console.log('Available Liquidity:', ethers.utils.formatUnits(availableLiquidity, 18));
    } catch (error) {
      console.error(`Error checking ${token.symbol}:`, error);
    }
  }
}

checkLimits().catch(console.error); 