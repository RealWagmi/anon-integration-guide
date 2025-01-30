import { type PublicClient, type WalletClient, type Account, encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { getPosition, GetPositionParams } from './getPositions.js';

interface ClosePositionParams {
  chainName: string;
  account: `0x${string}`;
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  isLong: boolean;
  sizeDelta?: bigint;  // Optional - if not provided, closes entire position
  acceptablePrice?: bigint;
  slippageBps?: number; // Optional - defaults to 0.3% (30 bps)
  executionFee?: bigint;
  withdrawETH?: boolean;  // Whether to withdraw in ETH (native token) or keep as wrapped
}

export async function closePosition(
  params: ClosePositionParams,
  options: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (params.chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    await options.notify("Checking for open position...");

    // Check if there's an open position first
    const positionResult = await getPosition(params, options);
    const positionData = JSON.parse(positionResult.data);
    
    if (positionData.error || !positionData.success) {
      return toResult(positionData.error || 'Failed to get position details', true);
    }

    const position = positionData.position;
    if (!position || position.size === '0.0') {
      return toResult(`No open ${params.isLong ? 'long' : 'short'} position found for ${params.account} with index token ${params.indexToken} and collateral ${params.collateralToken}`, true);
    }

    // Log position details before closing
    await options.notify('\nCurrent Position Details:');
    await options.notify(`Size: ${position.size} USD`);
    await options.notify(`Collateral: ${position.collateral} ${position.collateralToken} (${position.collateralUsd} USD)`);
    await options.notify(`Entry Price: ${position.averagePrice} USD`);
    await options.notify(`Current Price: ${position.currentPrice} USD`);
    await options.notify(`Unrealized PnL: ${position.unrealizedPnlUsd} USD (${position.unrealizedPnlPercentage}%)`);

    // Convert position size from string to bigint (multiply by 10^30 since it was formatted with 30 decimals)
    const positionSizeBigInt = BigInt(Math.floor(parseFloat(position.size) * 1e30));

    // Use provided size or full position size
    const sizeDelta = params.sizeDelta || positionSizeBigInt;

    // Validate size delta isn't larger than position
    if (params.sizeDelta && params.sizeDelta > positionSizeBigInt) {
      return toResult(`Requested size to close (${params.sizeDelta.toString()}) is larger than position size (${positionSizeBigInt.toString()})`, true);
    }

    await options.notify('\nClosing position...');

    // For closing positions:
    // - Long positions: acceptablePrice should be lower than current price (willing to sell lower)
    // - Short positions: acceptablePrice should be higher than current price (willing to buy higher)
    let closePrice = params.acceptablePrice;
    if (!closePrice) {
      // Get current price and add/subtract slippage based on position type
      const currentPrice = await options.getProvider(CHAIN_CONFIG[NETWORKS.SONIC].id).readContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
        abi: VaultPriceFeed,
        functionName: 'getPrice',
        args: [params.indexToken, false, true, true]
      }) as bigint;

      if (!currentPrice) {
        return toResult('Failed to get current price', true);
      }

      // For long positions, we use a more conservative price (2% lower)
      // This matches successful transactions where the acceptable price is significantly lower
      closePrice = params.isLong
        ? (currentPrice * BigInt(9800)) / BigInt(10000)  // 2% lower price for longs
        : (currentPrice * BigInt(10200)) / BigInt(10000); // 2% higher price for shorts

      await options.notify(`Using current price ${currentPrice.toString()} with 2% price buffer`);
    }

    const executionFee = params.executionFee || BigInt('1000000000000000'); // Default 0.001 S
    // Use collateral token for path
    const path = [params.collateralToken];

    await options.notify('\nTransaction Parameters:');
    await options.notify(`Size to Close: ${sizeDelta.toString()} (${params.sizeDelta ? 'Partial' : 'Full'} close)`);
    await options.notify(`Acceptable Price: ${closePrice.toString()}`);
    await options.notify(`Execution Fee: ${executionFee.toString()}`);
    await options.notify(`Withdraw as: ${params.withdrawETH ? 'Native token (S)' : 'Wrapped token (WETH)'}`);

    // Prepare transaction data
    const txData: TransactionParams = {
      target: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
      value: executionFee,
      data: encodeFunctionData({
        abi: PositionRouter,
        functionName: 'createDecreasePosition',
        args: [
          path,                // _path (using collateral token)
          params.indexToken,   // _indexToken
          0n,                  // _collateralDelta (0 to withdraw all collateral)
          sizeDelta,          // _sizeDelta
          params.isLong,       // _isLong
          params.account,      // _receiver
          closePrice,          // _acceptablePrice
          0n,                 // _minOut (0 since we don't need a minimum output amount)
          executionFee,        // _executionFee
          params.withdrawETH || false, // _withdrawETH
          '0x0000000000000000000000000000000000000000' as `0x${string}` // _callbackTarget
        ]
      })
    };

    // Send transaction using SDK
    const txResult = await options.sendTransactions({
      chainId: CHAIN_CONFIG[NETWORKS.SONIC].id,
      account: params.account,
      transactions: [txData]
    });

    return toResult(JSON.stringify({
      success: true,
      hash: txResult.data[0].hash,
      details: {
        positionSize: sizeDelta.toString(),
        closePrice: closePrice.toString(),
        isLong: params.isLong
      }
    }));
  } catch (error) {
    console.error('Error closing position:', error);
    return toResult('Transaction failed. Check parameters and try again.', true);
  }
} 
