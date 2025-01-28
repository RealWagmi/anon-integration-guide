import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

interface GetPerpsLiquidityParams {
  chainName: string;
  account: Address;
  indexToken: Address;
  collateralToken: Address;
  isLong: boolean;
}

interface LiquidityInfo {
  maxLeverage: number;
  maxPositionSize: bigint;
  maxCollateral: bigint;
  poolAmount: bigint;
  reservedAmount: bigint;
  availableLiquidity: bigint;
  fundingRate: bigint;
  priceUsd: number;
}

/**
 * Gets perpetual trading liquidity information for a token
 * @param props - The liquidity check parameters
 * @param options - SDK function options
 * @returns Liquidity information including max leverage, position sizes, and funding rates
 */
export async function getPerpsLiquidity(
  { chainName, account, indexToken, collateralToken, isLong }: GetPerpsLiquidityParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking perpetual trading liquidity information...");

  const provider = getProvider(146); // Sonic chain ID
  const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;
  const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;

  try {
    const vault = getContract({
      address: vaultAddress,
      abi: Vault,
      client: provider
    });

    const priceFeed = getContract({
      address: priceFeedAddress,
      abi: VaultPriceFeed,
      client: provider
    });

    // Get pool amount
    const poolAmount = await vault.read.poolAmounts([indexToken]) as bigint;

    // Get reserved amount
    const reservedAmount = await vault.read.reservedAmounts([indexToken]) as bigint;

    // Get max global size
    let maxGlobalSize = 0n;
    try {
      maxGlobalSize = await vault.read[isLong ? "maxGlobalLongSizes" : "maxGlobalShortSizes"]([indexToken]) as bigint;
    } catch (error) {
      console.log(`Failed to get max global ${isLong ? 'long' : 'short'} size:`, error);
    }

    // Get funding rate
    let fundingRate = 0n;
    try {
      fundingRate = await vault.read.cumulativeFundingRates([collateralToken]) as bigint;
    } catch (error) {
      console.log('Failed to get funding rate:', error);
    }

    // Get token price
    const priceResponse = await priceFeed.read.getPrice([indexToken, false, true, true]) as bigint;
    const priceInUsd = Number(priceResponse) / 1e30;

    // Calculate available liquidity
    const availableLiquidity = poolAmount - reservedAmount;
    
    // Calculate max leverage
    const maxLeverage = isLong ? 11 : 10;

    // Calculate max collateral based on position size and leverage
    const maxCollateral = maxGlobalSize / BigInt(maxLeverage);

    const liquidityInfo: LiquidityInfo = {
      maxLeverage,
      maxPositionSize: maxGlobalSize,
      maxCollateral,
      poolAmount,
      reservedAmount,
      availableLiquidity,
      fundingRate,
      priceUsd: priceInUsd
    };

    // Format the response for better readability
    const formattedInfo = {
      maxLeverage: liquidityInfo.maxLeverage,
      maxPositionSize: formatUnits(liquidityInfo.maxPositionSize, 30),
      maxCollateral: formatUnits(liquidityInfo.maxCollateral, 18),
      poolAmount: formatUnits(liquidityInfo.poolAmount, 18),
      reservedAmount: formatUnits(liquidityInfo.reservedAmount, 18),
      availableLiquidity: formatUnits(liquidityInfo.availableLiquidity, 18),
      fundingRate: liquidityInfo.fundingRate.toString(),
      priceUsd: liquidityInfo.priceUsd.toFixed(4)
    };

    return toResult(JSON.stringify(formattedInfo));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get perpetual trading liquidity: ${error.message}`, true);
    }
    return toResult("Failed to get perpetual trading liquidity: Unknown error", true);
  }
}

// Helper function to format units
function formatUnits(value: bigint, decimals: number): string {
  return (Number(value) / Math.pow(10, decimals)).toString();
} 