const { CONTRACT_ADDRESSES, NETWORKS } = require('../../../constants');
const { Vault } = require('../../../abis/Vault');
const { VaultPriceFeed } = require('../../../abis/VaultPriceFeed');
const { PositionRouter } = require('../../../abis/PositionRouter');
const { Address } = require('viem');
import {
  FunctionReturn,
  FunctionOptions,
  toResult,
  getChainFromName
} from '@heyanon/sdk';

interface GetLiquidityProps {
  chainName: string;
  account: `0x${string}`;
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
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
 * Gets leverage liquidity information for a token
 * @param props - The liquidity check parameters
 * @param options - SDK function options
 * @returns Liquidity information
 */
const getLiquidity = async (
  { chainName, account, indexToken, collateralToken, isLong }: GetLiquidityProps,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> => {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking liquidity information...");

  const provider = getProvider(146); // Sonic chain ID
  const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;
  const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;

  try {
    // Get pool amount
    const poolAmount = await provider.readContract({
      address: vaultAddress,
      abi: Vault,
      functionName: "poolAmounts",
      args: [indexToken]
    }) as bigint;

    // Get reserved amount
    const reservedAmount = await provider.readContract({
      address: vaultAddress,
      abi: Vault,
      functionName: "reservedAmounts",
      args: [indexToken]
    }) as bigint;

    // Get max global size
    let maxGlobalSize = 0n;
    try {
      maxGlobalSize = await provider.readContract({
        address: vaultAddress,
        abi: Vault,
        functionName: isLong ? "maxGlobalLongSizes" : "maxGlobalShortSizes",
        args: [indexToken]
      }) as bigint;
    } catch (error) {
      console.log(`Failed to get max global ${isLong ? 'long' : 'short'} size:`, error);
    }

    // Get funding rate
    let fundingRate = 0n;
    try {
      fundingRate = await provider.readContract({
        address: vaultAddress,
        abi: Vault,
        functionName: "cumulativeFundingRates",
        args: [collateralToken]
      }) as bigint;
    } catch (error) {
      console.log('Failed to get funding rate:', error);
    }

    // Get token price
    const priceResponse = await provider.readContract({
      address: priceFeedAddress,
      abi: VaultPriceFeed,
      functionName: "getPrice",
      args: [indexToken, false, true, true]
    }) as bigint;

    const currentPrice = priceResponse;
    const priceInUsd = Number(currentPrice) / 1e30;

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

    return toResult(JSON.stringify(formattedInfo), false);
  } catch (error) {
    console.error("Error in getLiquidity:", error);
    return toResult(error instanceof Error ? error.message : "Unknown error occurred", true);
  }
};

// Helper function to format units (similar to ethers.utils.formatUnits)
function formatUnits(value: bigint, decimals: number): string {
  return (Number(value) / Math.pow(10, decimals)).toString();
}

export const getLeverageLiquidity = getLiquidity;

export const getAllTokenLeverageLiquidity = async (
  chainName: string,
  account: `0x${string}`,
  options: FunctionOptions
): Promise<FunctionReturn> => {
  const tokens = [
    CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC,
    CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
  ];

  const results = await Promise.all(
    tokens.flatMap(token => [
      getLiquidity(
        {
          chainName,
          account,
          indexToken: token,
          collateralToken: token,
          isLong: true
        },
        options
      ),
      getLiquidity(
        {
          chainName,
          account,
          indexToken: token,
          collateralToken: token,
          isLong: false
        },
        options
      )
    ])
  );

  return toResult(results.map(r => r.data).join('\n'));
};

export { getLiquidity }; 