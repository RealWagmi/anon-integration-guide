import { ethers } from 'ethers';

// Define the Vault ABI directly
const VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "poolAmounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "reservedAmounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "maxGlobalLongSizes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "maxGlobalShortSizes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "cumulativeFundingRates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

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

export async function getLeverageLiquidity(params: GetLeverageLiquidityParams): Promise<LeverageLiquidityResult> {
  try {
    console.log('\nGetting leverage liquidity...');
    console.log('Vault address:', params.vaultAddress);
    console.log('Index token:', params.indexToken);
    console.log('Collateral token:', params.collateralToken);
    console.log('Is long:', params.isLong);

    const vault = new ethers.Contract(params.vaultAddress, VAULT_ABI, params.provider);

    // Get pool and reserved amounts for the token
    console.log('\nFetching contract data...');
    const [
      poolAmount,
      reservedAmount,
      maxGlobalLongSize,
      maxGlobalShortSize,
      fundingRate
    ] = await Promise.all([
      vault.poolAmounts(params.indexToken),
      vault.reservedAmounts(params.indexToken),
      vault.maxGlobalLongSizes(params.indexToken),
      vault.maxGlobalShortSizes(params.indexToken),
      vault.cumulativeFundingRates(params.collateralToken)
    ]);

    console.log('\nContract data:');
    console.log('Pool amount:', ethers.utils.formatUnits(poolAmount, 18));
    console.log('Reserved amount:', ethers.utils.formatUnits(reservedAmount, 18));
    console.log('Max global long size:', ethers.utils.formatUnits(maxGlobalLongSize, 30));
    console.log('Max global short size:', ethers.utils.formatUnits(maxGlobalShortSize, 30));
    console.log('Funding rate:', fundingRate.toString());

    // Calculate available liquidity (core contract logic)
    const availableLiquidity = poolAmount.sub(reservedAmount);
    
    // Get max position size based on global limits
    const maxPositionSize = params.isLong ? maxGlobalLongSize : maxGlobalShortSize;
    
    // Calculate max leverage (typically 11x for longs, 10x for shorts)
    const maxLeverage = params.isLong ? 11 : 10;

    // Calculate max collateral based on position size and leverage
    const maxCollateral = maxPositionSize.div(maxLeverage);

    console.log('\nCalculated values:');
    console.log('Available liquidity:', ethers.utils.formatUnits(availableLiquidity, 18));
    console.log('Max position size:', ethers.utils.formatUnits(maxPositionSize, 30));
    console.log('Max leverage:', maxLeverage);
    console.log('Max collateral:', ethers.utils.formatUnits(maxCollateral, 18));

    return {
      maxLeverage,
      maxPositionSize,
      maxCollateral,
      poolAmount,
      reservedAmount,
      availableLiquidity,
      fundingRate
    };
  } catch (error) {
    console.error('\nError in getLeverageLiquidity:', error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : error);
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
    const liquidity = await getLeverageLiquidity({
      provider,
      vaultAddress,
      indexToken,
      collateralToken,
      isLong
    });

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
    console.error('\nError in checkTokenLeverageLiquidity:', error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : error);
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
  const results: TokenLeverageResults = {};

  // Check USDC as collateral if index token is not USDC
  if (indexToken !== usdcAddress) {
    results.withUSDC = {
      long: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, usdcAddress, true),
      short: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, usdcAddress, false)
    };
  }

  // Check native token as collateral if index token is not native token
  if (indexToken !== nativeTokenAddress) {
    results.withNativeToken = {
      long: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, nativeTokenAddress, true),
      short: await checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, nativeTokenAddress, false)
    };
  }

  return results;
} 