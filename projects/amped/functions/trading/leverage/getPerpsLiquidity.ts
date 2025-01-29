import { Address, isAddress, formatUnits } from 'viem';
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
  maxPositionSize: string;
  poolAmount: string;
  poolAmountUsd: string;
  reservedAmount: string;
  reservedAmountUsd: string;
  availableLiquidity: string;
  availableLiquidityUsd: string;
  fundingRate: string;
  priceUsd: string;
}

/**
 * Gets perpetual trading liquidity information for a token
 * @param props - The liquidity check parameters
 * @param options - SDK function options
 * @returns FunctionReturn with liquidity information or error
 */
export async function getPerpsLiquidity(
  props: GetPerpsLiquidityParams,
  options: FunctionOptions
): Promise<FunctionReturn> {
  const { chainName, account, indexToken, collateralToken, isLong } = props;
  const { getProvider, notify } = options;

  try {
    // Validate chain
    if (chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    // Validate addresses
    if (!isAddress(indexToken) || !isAddress(collateralToken)) {
      return toResult("Invalid token addresses provided", true);
    }

    // Validate token addresses are not zero address
    if (indexToken === '0x0000000000000000000000000000000000000000' || 
        collateralToken === '0x0000000000000000000000000000000000000000') {
      return toResult("Zero addresses are not valid tokens", true);
    }

    // Validate account address
    if (!isAddress(account)) {
      return toResult("Invalid account address provided", true);
    }
    if (account === '0x0000000000000000000000000000000000000000') {
      return toResult("Zero address is not a valid account", true);
    }

    await notify("Checking perpetual trading liquidity information...");

    const provider = getProvider(146); // Sonic chain ID
    if (!provider) {
      return toResult("Failed to get provider", true);
    }

    const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT as Address;
    const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as Address;

    // Get token price first to validate token is supported
    const priceResponse = await provider.readContract({
      address: priceFeedAddress,
      abi: VaultPriceFeed,
      functionName: 'getPrice',
      args: [indexToken, isLong, !isLong, true]
    }) as bigint;

    if (priceResponse === 0n) {
      return toResult(`No price feed available for ${indexToken}`, true);
    }

    const priceUsd = Number(priceResponse) / 1e30;

    // Get pool amount
    const poolAmount = await provider.readContract({
      address: vaultAddress,
      abi: Vault,
      functionName: 'poolAmounts',
      args: [indexToken]
    }) as bigint;

    // Get reserved amount
    const reservedAmount = await provider.readContract({
      address: vaultAddress,
      abi: Vault,
      functionName: 'reservedAmounts',
      args: [indexToken]
    }) as bigint;

    // Get funding rate
    const fundingRate = await provider.readContract({
      address: vaultAddress,
      abi: Vault,
      functionName: 'cumulativeFundingRates',
      args: [collateralToken]
    }) as bigint;

    // Calculate available liquidity
    const availableLiquidity = poolAmount - reservedAmount;
    if (availableLiquidity < 0n) {
      return toResult("Invalid liquidity calculation: negative available liquidity", true);
    }
    
    // Calculate max leverage based on position type
    const maxLeverage = isLong ? 11 : 10;

    // Calculate max position size based on available liquidity and leverage
    const maxPositionSize = availableLiquidity * BigInt(maxLeverage);

    // Calculate USD values
    const poolAmountUsd = Number(formatUnits(poolAmount, 18)) * priceUsd;
    const reservedAmountUsd = Number(formatUnits(reservedAmount, 18)) * priceUsd;
    const availableLiquidityUsd = Number(formatUnits(availableLiquidity, 18)) * priceUsd;

    const liquidityInfo: LiquidityInfo = {
      maxLeverage,
      maxPositionSize: formatUnits(maxPositionSize, 30),
      poolAmount: formatUnits(poolAmount, 18),
      poolAmountUsd: poolAmountUsd.toFixed(2),
      reservedAmount: formatUnits(reservedAmount, 18),
      reservedAmountUsd: reservedAmountUsd.toFixed(2),
      availableLiquidity: formatUnits(availableLiquidity, 18),
      availableLiquidityUsd: availableLiquidityUsd.toFixed(2),
      fundingRate: fundingRate.toString(),
      priceUsd: priceUsd.toFixed(4)
    };

    return toResult(JSON.stringify(liquidityInfo));
  } catch (error) {
    console.error('Error in getPerpsLiquidity:', error);
    if (error instanceof Error) {
      return toResult(`Failed to get perpetual trading liquidity: ${error.message}`, true);
    }
    return toResult("Failed to get perpetual trading liquidity: Unknown error", true);
  }
} 