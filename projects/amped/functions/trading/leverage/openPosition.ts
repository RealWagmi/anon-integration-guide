import { type PublicClient, type WalletClient, type Account, type Chain, encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { getPerpsLiquidity } from './getPerpsLiquidity.js';
import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';

interface OpenPositionParams {
  chainName: string;
  account: `0x${string}`;
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  isLong: boolean;
  sizeUsd: number;
  collateralUsd: number;
  referralCode?: `0x${string}`;
  slippageBps?: number; // Optional slippage in basis points (e.g., 30 = 0.3%)
}

interface PositionValidation {
  success: boolean;
  error?: string;
  details?: {
    indexTokenPrice: number;
    collateralTokenPrice: number;
    leverage: number;
    requiredCollateralAmount: bigint;
    sizeDelta: bigint;
    allowance: bigint;
    minExecutionFee: bigint;
    indexTokenPriceRaw: bigint;
  };
}

async function checkTokenBalance(
  publicClient: PublicClient,
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  decimals: number = 18
): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20,
      functionName: 'balanceOf',
      args: [userAddress]
    });

    return Number(balance) / Math.pow(10, decimals);
  } catch (error) {
    console.error('Error checking token balance:', error);
    return 0;
  }
}

export async function validateOpenPosition(
  publicClient: PublicClient,
  params: OpenPositionParams,
  account: Account
): Promise<PositionValidation> {
  try {
    // Get token prices
    const [indexTokenPrice, collateralTokenPrice] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as `0x${string}`,
        abi: VaultPriceFeed,
        functionName: 'getPrice',
        args: [params.indexToken, params.isLong, !params.isLong, true]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as `0x${string}`,
        abi: VaultPriceFeed,
        functionName: 'getPrice',
        args: [params.collateralToken, false, true, true]
      })
    ]) as [bigint, bigint];

    // Convert prices to USD with 30 decimals for display
    const indexTokenPriceUsd = Number(indexTokenPrice) / 1e30;
    const collateralTokenPriceUsd = Number(collateralTokenPrice) / 1e30;

    console.log('\nPrice Details:');
    console.log('Index Token Price:', indexTokenPriceUsd);
    console.log('Collateral Token Price:', collateralTokenPriceUsd);

    // Calculate required collateral amount in token decimals (18 for most tokens)
    const requiredCollateralAmount = BigInt(Math.floor(params.collateralUsd / collateralTokenPriceUsd * 1e18));

    // Get minimum execution fee
    const minExecutionFee = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER as `0x${string}`,
      abi: PositionRouter,
      functionName: 'minExecutionFee',
    }) as bigint;

    // Check token allowance
    const allowance = await publicClient.readContract({
      address: params.collateralToken,
      abi: ERC20,
      functionName: 'allowance',
      args: [account.address, CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER]
    }) as bigint;

    return {
      success: true,
      details: {
        indexTokenPrice: indexTokenPriceUsd,
        collateralTokenPrice: collateralTokenPriceUsd,
        leverage: params.sizeUsd / params.collateralUsd,
        requiredCollateralAmount,
        sizeDelta: 0n, // This will be calculated in openPosition
        allowance,
        minExecutionFee,
        indexTokenPriceRaw: indexTokenPrice
      }
    };
  } catch (error) {
    console.error('Error validating position:', error);
    return { success: false, error: 'Failed to validate position parameters' };
  }
}

async function checkAlternativeLiquidity(
  publicClient: PublicClient,
  isLong: boolean,
  options: FunctionOptions,
  accountAddress: `0x${string}`
): Promise<{ token: string; address: `0x${string}`; availableLiquidityUsd: string }[]> {
  // Define available tokens based on position type
  const longTokens = [
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN },
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH }
  ];

  const shortTokens = [
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC },
    { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC }
  ];

  const tokensToCheck = isLong ? longTokens : shortTokens;
  const results = [];

  for (const token of tokensToCheck) {
    const liquidityResult = await getPerpsLiquidity(
      {
        chainName: 'sonic',
        account: accountAddress,
        indexToken: token.address,
        collateralToken: token.address,
        isLong
      },
      options
    );

    if (liquidityResult.success) {
      const liquidityInfo = JSON.parse(liquidityResult.data);
      results.push({
        token: token.symbol,
        address: token.address,
        availableLiquidityUsd: liquidityInfo.availableLiquidityUsd
      });
    }
  }

  // Sort by available liquidity (highest first)
  return results.sort((a, b) => Number(b.availableLiquidityUsd) - Number(a.availableLiquidityUsd));
}

export async function openPosition(
  params: OpenPositionParams,
  { getProvider, notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (params.chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    await notify("Opening position...");

    const publicClient = getProvider(146); // Sonic chain ID

    // Basic parameter validation
    if (params.sizeUsd < 11) {
      return toResult('Minimum position size $11 required', true);
    }

    // Check minimum collateral ($10)
    if (params.collateralUsd < 10) {
      return toResult('Minimum collateral $10 required', true);
    }

    // Check minimum leverage (1.1x)
    const leverage = params.sizeUsd / params.collateralUsd;
    if (leverage < 1.1) {
      return toResult('Minimum 1.1x leverage required', true);
    }

    // Check liquidity using getPerpsLiquidity
    const liquidityResult = await getPerpsLiquidity(
      {
        chainName: params.chainName,
        account: params.account,
        indexToken: params.indexToken,
        collateralToken: params.collateralToken,
        isLong: params.isLong
      },
      { getProvider, notify, sendTransactions }
    );

    if (!liquidityResult.success) {
      return toResult(liquidityResult.data, true);
    }

    const liquidityInfo = JSON.parse(liquidityResult.data);

    // If position size exceeds available liquidity, check alternatives
    if (params.sizeUsd > Number(liquidityInfo.availableLiquidityUsd)) {
      const alternatives = await checkAlternativeLiquidity(publicClient, params.isLong, { getProvider, notify, sendTransactions }, params.account);
      const viableAlternatives = alternatives.filter(alt => 
        Number(alt.availableLiquidityUsd) >= params.sizeUsd && 
        alt.address.toLowerCase() !== params.indexToken.toLowerCase()
      );

      if (viableAlternatives.length > 0) {
        return toResult(JSON.stringify({
          error: `Position size $${params.sizeUsd} exceeds available liquidity $${liquidityInfo.availableLiquidityUsd}`,
          alternatives: viableAlternatives
        }), true);
      }
      
      return toResult(`Position size $${params.sizeUsd} exceeds available liquidity $${liquidityInfo.availableLiquidityUsd}. No alternative tokens have sufficient liquidity.`, true);
    }

    // Validate leverage against max leverage
    if (leverage > liquidityInfo.maxLeverage) {
      return toResult(`Leverage ${leverage.toFixed(2)}x exceeds maximum allowed ${liquidityInfo.maxLeverage}x`, true);
    }

    // Fixed slippage for all positions
    const slippageBps = params.slippageBps || 30; // Default to 0.3% slippage if not specified
    const validation = await validateOpenPosition(publicClient, params, { address: params.account } as Account);

    if (!validation.success || !validation.details) {
      return toResult(validation.error || 'Position validation failed', true);
    }

    // Calculate sizeDelta in USD terms with 30 decimals
    const positionSizeUsd = params.collateralUsd * (params.sizeUsd / params.collateralUsd); // collateral * leverage
    const sizeDelta = BigInt(Math.floor(positionSizeUsd * 1e30));

    // Calculate acceptable price with same decimals as keeper (30)
    const acceptablePrice = params.isLong
      ? (validation.details.indexTokenPriceRaw * BigInt(10000 + slippageBps)) / BigInt(10000)
      : (validation.details.indexTokenPriceRaw * BigInt(10000 - slippageBps)) / BigInt(10000);

    await notify('\nTransaction Parameters:');
    await notify(`Collateral Amount: ${validation.details.requiredCollateralAmount.toString()}`);
    await notify(`Position Size USD: ${positionSizeUsd}`);
    await notify(`Leverage: ${leverage}x`);
    await notify(`Size Delta (30d USD): ${sizeDelta.toString()}`);
    await notify(`Price (30d): ${validation.details.indexTokenPriceRaw.toString()}`);
    await notify(`Acceptable Price (30d): ${acceptablePrice.toString()}`);
    await notify(`Execution Fee: ${validation.details.minExecutionFee.toString()}`);

    // Prepare transaction data
    const txData: TransactionParams = {
      target: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
      value: validation.details.minExecutionFee,
      data: encodeFunctionData({
        abi: PositionRouter,
        functionName: 'createIncreasePosition',
        args: [
          params.collateralToken === params.indexToken 
            ? [params.collateralToken]
            : [params.collateralToken, params.indexToken],
          params.indexToken,
          validation.details.requiredCollateralAmount,
          0n,
          sizeDelta,
          params.isLong,
          acceptablePrice,
          validation.details.minExecutionFee,
          params.referralCode || '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000'
        ]
      })
    };

    // Send transaction using SDK
    try {
      const txResult = await sendTransactions({
        chainId: 146, // Sonic chain ID
        account: params.account,
        transactions: [txData]
      });

      return toResult(JSON.stringify({
        success: true,
        hash: txResult.data[0].hash,
        details: {
          positionSizeUsd,
          leverage,
          sizeDelta: sizeDelta.toString(),
          acceptablePrice: acceptablePrice.toString()
        }
      }));
    } catch (txError) {
      console.error('Transaction error:', txError);
      return toResult(
        txError instanceof Error 
          ? `Transaction failed: ${txError.message}` 
          : 'Transaction failed. Please check your parameters and try again.',
        true
      );
    }
  } catch (error) {
    console.error('Error opening position:', error);
    return toResult(
      error instanceof Error 
        ? `Failed to open position: ${error.message}` 
        : 'Failed to open position. Please check your parameters and try again.',
      true
    );
  }
} 