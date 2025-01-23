import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';

export interface GetLeverageLiquidityParams {
  provider: ethers.providers.Provider;
  vaultAddress: string;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
}

export interface LeverageLiquidityResult {
  maxLeverage: number;
  maxPositionSize: ethers.BigNumber;
  maxCollateral: ethers.BigNumber;
  poolAmount: ethers.BigNumber;
  reservedAmount: ethers.BigNumber;
  fundingRate: ethers.BigNumber;
}

export async function getLeverageLiquidity({
  provider,
  vaultAddress,
  indexToken,
  collateralToken,
  isLong,
}: GetLeverageLiquidityParams): Promise<LeverageLiquidityResult> {
  const vault = new ethers.Contract(vaultAddress, Vault, provider);

  // Get pool and reserved amounts for the token
  const [
    poolAmount,
    reservedAmount,
    maxGlobalLongSize,
    maxGlobalShortSize,
    fundingRate
  ] = await Promise.all([
    vault.poolAmounts(indexToken),
    vault.reservedAmounts(indexToken),
    vault.maxGlobalLongSizes(indexToken),
    vault.maxGlobalShortSizes(indexToken),
    vault.cumulativeFundingRates(collateralToken)
  ]);

  // Calculate available amount for leverage
  const availableAmount = poolAmount.sub(reservedAmount);
  
  // Get max position size based on global limits
  const maxPositionSize = isLong ? maxGlobalLongSize : maxGlobalShortSize;
  
  // Calculate max leverage (typically 11x for longs, 10x for shorts)
  const maxLeverage = isLong ? 11 : 10;

  // Calculate max collateral based on position size and leverage
  const maxCollateral = maxPositionSize.div(maxLeverage);

  return {
    maxLeverage,
    maxPositionSize,
    maxCollateral,
    poolAmount,
    reservedAmount,
    fundingRate
  };
} 