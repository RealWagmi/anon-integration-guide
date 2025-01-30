import { type PublicClient } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';

export interface Position {
  size: string;
  collateral: string;
  collateralUsd: string;
  averagePrice: string;
  currentPrice: string;
  entryFundingRate: string;
  hasProfit: boolean;
  realizedPnl: string;
  unrealizedPnlUsd: string;
  unrealizedPnlPercentage: string;
  lastUpdated: Date | null;
}

export interface GetPositionParams {
  chainName: string;
  account: `0x${string}`;
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  isLong: boolean;
}

export interface OpenPosition {
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  position: Position;
}

export async function getPosition(
  params: GetPositionParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (params.chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    const publicClient = getProvider(146); // Sonic chain ID

    // Get raw position data
    const position = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: Vault,
      functionName: 'getPosition',
      args: [
        params.account,
        params.collateralToken,
        params.indexToken,
        params.isLong
      ]
    }) as [bigint, bigint, bigint, bigint, boolean, bigint, bigint];

    // Get current price
    const currentPrice = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
      abi: VaultPriceFeed,
      functionName: 'getPrice',
      args: [params.indexToken, false, true, true]
    }) as bigint;

    // Get collateral token price
    const collateralPrice = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
      abi: VaultPriceFeed,
      functionName: 'getPrice',
      args: [params.collateralToken, false, true, true]
    }) as bigint;

    // Calculate collateral in USD
    const collateralBigInt = BigInt(position[1]);
    const collateralUsdBigInt = collateralBigInt * BigInt(collateralPrice);
    const collateralUsd = Number(collateralBigInt) / Math.pow(10, 30);
    const collateralTokens = collateralUsd / (Number(collateralPrice) / Math.pow(10, 30));

    // Calculate unrealized PnL
    const sizeBigInt = BigInt(position[0]);
    const averagePriceBigInt = BigInt(position[2]);
    const currentPriceBigInt = BigInt(currentPrice);

    let unrealizedPnlUsd = 0;
    if (sizeBigInt > 0n) {
      const pnlBigInt = params.isLong ? 
        sizeBigInt * (currentPriceBigInt - averagePriceBigInt) :
        sizeBigInt * (averagePriceBigInt - currentPriceBigInt);
      unrealizedPnlUsd = Number(pnlBigInt) / Math.pow(10, 60);
    }

    const unrealizedPnlPercentage = collateralUsd > 0 ? (unrealizedPnlUsd / collateralUsd) * 100 : 0;

    // Log raw position data for debugging
    await notify('\nRaw Position Data:');
    await notify(`Size: ${position[0].toString()}`);
    await notify(`Collateral: ${position[1].toString()}`);
    await notify(`Average Price: ${position[2].toString()}`);
    await notify(`Entry Funding Rate: ${position[3].toString()}`);
    await notify(`Has Profit: ${position[4]}`);
    await notify(`Realized PnL: ${position[5].toString()}`);
    await notify(`Last Updated: ${position[6].toString()}`);

    // Format position data
    const formattedPosition: Position = {
      size: formatUnits(sizeBigInt, 30),
      collateral: collateralTokens.toFixed(8),
      collateralUsd: formatUnits(BigInt(Math.floor(collateralUsd * Math.pow(10, 30))), 30),
      averagePrice: formatUnits(averagePriceBigInt, 30),
      currentPrice: formatUnits(currentPriceBigInt, 30),
      entryFundingRate: position[3].toString(),
      hasProfit: position[4],
      realizedPnl: formatUnits(BigInt(position[5]), 30),
      unrealizedPnlUsd: formatUnits(BigInt(Math.floor(unrealizedPnlUsd * Math.pow(10, 30))), 30),
      unrealizedPnlPercentage: unrealizedPnlPercentage.toFixed(2),
      lastUpdated: position[6] ? new Date(Number(position[6]) * 1000) : null
    };

    // Log formatted position details
    if (notify) {
      await notify('\nFormatted Position Details:');
      await notify(`Size: ${Number(formattedPosition.size).toFixed(2)} USD`);
      await notify(`Collateral: ${Number(formattedPosition.collateral).toFixed(8)} ANON (${Number(formattedPosition.collateralUsd).toFixed(2)} USD)`);
      await notify(`Average Entry Price: ${Number(formattedPosition.averagePrice).toFixed(4)} USD`);
      await notify(`Current Price: ${Number(formattedPosition.currentPrice).toFixed(4)} USD`);
      await notify(`Entry Funding Rate: ${formattedPosition.entryFundingRate}`);
      await notify(`Has Profit: ${formattedPosition.hasProfit}`);
      await notify(`Realized PnL: ${Number(formattedPosition.realizedPnl).toFixed(4)} USD`);
      await notify(`Unrealized PnL: ${Number(formattedPosition.unrealizedPnlUsd).toFixed(4)} USD (${formattedPosition.unrealizedPnlPercentage}%)`);
      if (formattedPosition.lastUpdated) {
        await notify(`Last Updated: ${formattedPosition.lastUpdated.toISOString()}`);
      }

      if (position[0] === 0n) {
        await notify('\nNo active position found (zero size).');
      } else {
        await notify(`\nActive position found with size: ${Number(formattedPosition.size).toFixed(2)} USD`);
      }
    }

    return toResult(JSON.stringify({
      success: true,
      position: formattedPosition
    }, (_, value) => 
      typeof value === 'bigint' ? value.toString() : 
      typeof value === 'boolean' ? value :
      value
    ));
  } catch (error) {
    console.error('Error getting position:', error);
    return toResult('Failed to get position details', true);
  }
}

export async function getAllOpenPositions(
  params: { chainName: string; account: `0x${string}`; isLong: boolean },
  options: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (params.chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    // Define valid index tokens for positions
    const indexTokens = [
      CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
    ] as const;

    // Define possible collateral tokens
    const collateralTokens = [
      CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
    ] as const;

    const openPositions: OpenPosition[] = [];

    // Check each index token
    for (const indexToken of indexTokens) {
      await options.notify(`\nChecking ${params.isLong ? 'long' : 'short'} positions for ${
        indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? 'S' :
        indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH ? 'WETH' : 'ANON'
      }...`);

      // Check each possible collateral token for this index
      for (const collateralToken of collateralTokens) {
        const positionResult = await getPosition({
          chainName: params.chainName,
          account: params.account,
          indexToken: indexToken as `0x${string}`,
          collateralToken: collateralToken as `0x${string}`,
          isLong: params.isLong
        }, options);

        const positionData = JSON.parse(positionResult.data);
        if (positionData.success && positionData.position && positionData.position.size !== '0.0') {
          openPositions.push({
            indexToken: indexToken as `0x${string}`,
            collateralToken: collateralToken as `0x${string}`,
            position: positionData.position
          });
        }
      }
    }

    if (openPositions.length === 0) {
      await options.notify(`\nNo active ${params.isLong ? 'long' : 'short'} positions found`);
      return toResult(JSON.stringify({ success: true, positions: [] }));
    }

    await options.notify(`\nFound ${openPositions.length} active ${params.isLong ? 'long' : 'short'} position(s):`);
    openPositions.forEach((pos, index) => {
      options.notify(`\n${index + 1}. Position Details:`);
      options.notify(`Index Token: ${
        pos.indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? 'S' :
        pos.indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH ? 'WETH' : 'ANON'
      }`);
      options.notify(`Collateral Token: ${
        pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? 'S' :
        pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC ? 'USDC' : 'ANON'
      }`);
      options.notify(`Size: ${pos.position.size} USD`);
      options.notify(`Collateral: ${pos.position.collateral} ${
        pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? 'S' :
        pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC ? 'USDC' : 'ANON'
      } (${pos.position.collateralUsd} USD)`);
      options.notify(`Entry Price: ${pos.position.averagePrice} USD`);
      options.notify(`Current Price: ${pos.position.currentPrice} USD`);
      options.notify(`Unrealized PnL: ${pos.position.unrealizedPnlUsd} USD (${pos.position.unrealizedPnlPercentage}%)`);
    });

    return toResult(JSON.stringify({
      success: true,
      positions: openPositions
    }));
  } catch (error) {
    console.error('Error getting all positions:', error);
    return toResult('Failed to get all position details', true);
  }
}

// Helper function to format units (similar to ethers.utils.formatUnits)
function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt('1' + '0'.repeat(decimals));
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  let result = integerPart.toString();
  if (fractionalPart > 0n) {
    let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    // Remove trailing zeros
    while (fractionalStr.endsWith('0')) {
      fractionalStr = fractionalStr.slice(0, -1);
    }
    if (fractionalStr.length > 0) {
      result += '.' + fractionalStr;
    }
  }
  
  return result;
} 