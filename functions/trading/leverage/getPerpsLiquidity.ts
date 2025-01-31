import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from 'projects/amped/constants';
import { Vault } from 'projects/amped/abis/Vault';
import { VaultPriceFeed } from 'projects/amped/abis/VaultPriceFeed';

interface GetPerpsLiquidityParams {
  chainName: string;
  account: Address;
  indexToken: Address;
  collateralToken: Address;
  isLong: boolean;
}

interface LiquidityInfo {
  maxLeverage: number;
  maxPositionSize: string;
  maxCollateral: string;
  poolAmount: string;
  reservedAmount: string;
  fundingRate: string;
  availableLiquidity: string;
  priceUsd: string;
  totalAvailableUsd: string;  // Total USD value of available liquidity
  maxPositionSizeUsd: string; // Max position size in USD
}

// Get token decimals based on token address
function getTokenDecimals(tokenAddress: Address): number {
  // USDC and EURC use 6 decimals, others use 18
  if (tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase() ||
      tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC.toLowerCase()) {
    return 6;
  }
  return 18;
}

// Format token amount based on decimals
function formatTokenAmount(amount: bigint, decimals: number): string {
  return (Number(amount) / Math.pow(10, decimals)).toString();
}

/**
 * Gets liquidity information for a token in the perps market
 * @param props - The liquidity check parameters
 * @param options - SDK function options
 * @returns Liquidity information
 */
export async function getPerpsLiquidity(
  { chainName, account, indexToken, collateralToken, isLong }: GetPerpsLiquidityParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking liquidity information...");

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

    // Get pool and reserved amounts for the token
    const [
      poolAmount,
      reservedAmount,
      fundingRate,
      price
    ] = await Promise.all([
      vault.read.poolAmounts([indexToken]) as Promise<bigint>,
      vault.read.reservedAmounts([indexToken]) as Promise<bigint>,
      vault.read.cumulativeFundingRates([collateralToken]) as Promise<bigint>,
      priceFeed.read.getPrice([indexToken, false, true, true]) as Promise<bigint>
    ]);

    // Calculate available liquidity
    const availableLiquidity = poolAmount - reservedAmount;
    
    // Calculate max leverage (typically 11x for longs, 10x for shorts)
    const maxLeverage = isLong ? 11 : 10;

    // Calculate max position size based on available liquidity
    // We'll use 80% of available liquidity as max position size to be conservative
    const maxPositionSize = availableLiquidity * 8n / 10n;

    // Calculate max collateral based on position size and leverage
    const maxCollateral = maxPositionSize / BigInt(maxLeverage);

    // Get token decimals
    const tokenDecimals = getTokenDecimals(indexToken);

    // Calculate USD values
    const priceUsd = Number(price) / 1e30;
    const availableLiquidityNum = Number(availableLiquidity) / Math.pow(10, tokenDecimals);
    const maxPositionSizeNum = Number(maxPositionSize) / Math.pow(10, tokenDecimals);
    const totalAvailableUsd = availableLiquidityNum * priceUsd;
    const maxPositionSizeUsd = maxPositionSizeNum * priceUsd;

    const liquidityInfo: LiquidityInfo = {
      maxLeverage,
      maxPositionSize: formatTokenAmount(maxPositionSize, tokenDecimals),
      maxCollateral: formatTokenAmount(maxCollateral, tokenDecimals),
      poolAmount: formatTokenAmount(poolAmount, tokenDecimals),
      reservedAmount: formatTokenAmount(reservedAmount, tokenDecimals),
      fundingRate: fundingRate.toString(),
      availableLiquidity: formatTokenAmount(availableLiquidity, tokenDecimals),
      priceUsd: priceUsd.toString(),
      totalAvailableUsd: totalAvailableUsd.toFixed(2),
      maxPositionSizeUsd: maxPositionSizeUsd.toFixed(2)
    };

    return toResult(JSON.stringify(liquidityInfo));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get perpetual trading liquidity: ${error.message}`, true);
    }
    return toResult("Failed to get perpetual trading liquidity: Unknown error", true);
  }
} 