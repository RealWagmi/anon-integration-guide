import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';

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
  availableLiquidity: ethers.BigNumber;
  fundingRate: ethers.BigNumber;
}

export interface TokenLeverageInfo {
  maxLeverage: number;
  maxPositionSize: string;
  maxCollateral: string;
  poolAmount: string;
  reservedAmount: string;
  fundingRate: string;
  availableLiquidity: string;
}

export interface TokenLeverageResults {
  withUSDC?: {
    long?: TokenLeverageInfo;
    short?: TokenLeverageInfo;
  };
  withNativeToken?: {
    long?: TokenLeverageInfo;
    short?: TokenLeverageInfo;
  };
}

export async function getLeverageLiquidity({
  provider,
  vaultAddress,
  indexToken,
  collateralToken,
  isLong,
}: GetLeverageLiquidityParams): Promise<LeverageLiquidityResult> {
  const vault = new ethers.Contract(vaultAddress, Vault, provider);
  let poolAmount = ethers.BigNumber.from(0);
  let reservedAmount = ethers.BigNumber.from(0);
  let maxGlobalSize = ethers.BigNumber.from(0);
  let fundingRate = ethers.BigNumber.from(0);

  try {
    console.log('Getting pool amount...');
    poolAmount = await vault.poolAmounts(indexToken);
    
    console.log('Getting reserved amount...');
    reservedAmount = await vault.reservedAmounts(indexToken);
    
    console.log('Getting max global sizes...');
    try {
      maxGlobalSize = isLong 
        ? await vault.maxGlobalLongSizes(indexToken)
        : await vault.maxGlobalShortSizes(indexToken);
    } catch (error) {
      console.log(`Failed to get max global ${isLong ? 'long' : 'short'} size:`, error);
      // Keep maxGlobalSize as 0
    }
    
    console.log('Getting funding rate...');
    try {
      fundingRate = await vault.cumulativeFundingRates(collateralToken);
    } catch (error) {
      console.log('Failed to get funding rate:', error);
      // Keep fundingRate as 0
    }

    // Calculate available liquidity (core contract logic)
    const availableLiquidity = poolAmount.sub(reservedAmount);
    
    // Calculate max leverage (typically 11x for longs, 10x for shorts)
    const maxLeverage = isLong ? 11 : 10;

    // Calculate max collateral based on position size and leverage
    const maxCollateral = maxGlobalSize.div(maxLeverage);

    console.log('Results:', {
      maxLeverage,
      maxPositionSize: maxGlobalSize.toString(),
      maxCollateral: maxCollateral.toString(),
      poolAmount: poolAmount.toString(),
      reservedAmount: reservedAmount.toString(),
      availableLiquidity: availableLiquidity.toString(),
      fundingRate: fundingRate.toString()
    });

    return {
      maxLeverage,
      maxPositionSize: maxGlobalSize,
      maxCollateral,
      poolAmount,
      reservedAmount,
      availableLiquidity,
      fundingRate
    };
  } catch (error) {
    console.error('Error in getLeverageLiquidity:', error);
    throw error;
  }
}

async function checkTokenLeverageLiquidity(
  provider: ethers.providers.Provider,
  vaultAddress: string,
  indexToken: string,
  collateralToken: string,
  isLong: boolean
): Promise<TokenLeverageInfo | undefined> {
  try {
    console.log(`Attempting to get liquidity for:
      Vault: ${vaultAddress}
      Index Token: ${indexToken}
      Collateral: ${collateralToken}
      Is Long: ${isLong}`);

    const liquidity = await getLeverageLiquidity({
      provider,
      vaultAddress,
      indexToken,
      collateralToken,
      isLong
    });

    console.log('Got liquidity result:', JSON.stringify(liquidity, (_, v) => 
      typeof v === 'bigint' ? v.toString() : v, 2));

    return {
      maxLeverage: liquidity.maxLeverage,
      maxPositionSize: ethers.utils.formatUnits(liquidity.maxPositionSize, 30),
      maxCollateral: ethers.utils.formatUnits(liquidity.maxCollateral, 18),
      poolAmount: ethers.utils.formatUnits(liquidity.poolAmount, 18),
      reservedAmount: ethers.utils.formatUnits(liquidity.reservedAmount, 18),
      fundingRate: liquidity.fundingRate.toString(),
      availableLiquidity: ethers.utils.formatUnits(liquidity.availableLiquidity, 18)
    };
  } catch (error) {
    console.error('Error in checkTokenLeverageLiquidity:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return undefined;
  }
}

export async function getAllTokenLeverageLiquidity(
  provider: ethers.providers.Provider,
  vaultAddress: string,
  indexToken: string,
  usdcAddress: string,
  nativeTokenAddress: string
): Promise<TokenLeverageResults> {
  console.log(`Checking liquidity for index token: ${indexToken}`);
  console.log(`USDC Address: ${usdcAddress}, Native Address: ${nativeTokenAddress}`);

  const results: TokenLeverageResults = {};

  // Only check USDC collateral for shorts
  if (indexToken !== usdcAddress) {
    console.log(`Checking USDC collateral for ${indexToken}`);
    results.withUSDC = {
      short: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, usdcAddress, false)
    };
  }

  // Only check native token collateral for longs on supported tokens
  const longSupportedTokens = [
    nativeTokenAddress.toLowerCase(), // S token
    CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON.toLowerCase(),
    CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH.toLowerCase()
  ];
  
  if (indexToken !== nativeTokenAddress && longSupportedTokens.includes(indexToken.toLowerCase())) {
    console.log(`Checking native collateral for ${indexToken}`);
    results.withNativeToken = {
      long: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, nativeTokenAddress, true)
    };
  }

  console.log('Interim results:', JSON.stringify(results, null, 2));
  return results;
} 