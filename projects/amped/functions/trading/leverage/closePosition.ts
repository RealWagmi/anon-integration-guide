import { type Address, encodeFunctionData, parseEther, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { getAllOpenPositions } from './getAllOpenPositions.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

export interface Props {
  chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
  account: string;
  indexToken?: string;
  collateralToken?: string;
  isLong?: boolean;
  sizeDelta?: string;
  slippageBps?: number;
  withdrawETH?: boolean;
  callbackTarget?: string;
}

export const closePosition = async (props: Props, options: FunctionOptions): Promise<FunctionReturn> => {
  const { chainName, account, indexToken, collateralToken, isLong, sizeDelta, 
          slippageBps = 30, withdrawETH = true, callbackTarget = '0x0000000000000000000000000000000000000000' } = props;

  try {
    // Get minimum execution fee from contract
    const minExecutionFee = await options.evm.getProvider(146).readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
      abi: PositionRouter,
      functionName: 'minExecutionFee',
    }) as bigint;

    await options.notify(`Minimum execution fee: ${minExecutionFee.toString()} wei`);

    // Get all open positions (regardless of long/short if not specified)
    const positionsResult = await getAllOpenPositions({
      chainName,
      account: account as `0x${string}`,
      isLong: isLong ?? true // Temporary value to get all positions
    }, options);

    if (!positionsResult.success || !positionsResult.data) {
      throw new Error('Failed to get open positions');
    }

    let positions = JSON.parse(positionsResult.data).positions || [];
    
    // Filter positions based on input parameters
    if (indexToken) {
      positions = positions.filter((p: any) => 
        p.indexToken.toLowerCase() === indexToken.toLowerCase() ||
        (p.tokenSymbol === 'S' && 
         (indexToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN.toLowerCase() ||
          indexToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()))
      );
    }

    if (typeof isLong === 'boolean') {
      positions = positions.filter((p: any) => p.isLong === isLong);
    }

    if (positions.length === 0) {
      throw new Error(`No matching positions found${indexToken ? ` for ${indexToken}` : ''}`);
    }

    await options.notify(`Found ${positions.length} position(s) to close`);

    const wrappedToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN;
    const transactions = [];

    for (const position of positions) {
      // For path construction:
      // 1. If withdrawing to ETH: [TOKEN, WS] for any token (including WETH)
      // 2. If not withdrawing to ETH: [TOKEN] single token path
      // Note: For WS/S positions, we always use [WS] regardless of withdrawETH
      const isWSPosition = position.indexToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase() ||
                          position.indexToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN.toLowerCase();

      const path = isWSPosition
        ? [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN] as [`0x${string}`]
        : withdrawETH 
          ? [position.indexToken, CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN] as [`0x${string}`, `0x${string}`]
          : [position.indexToken] as [`0x${string}`];

      await options.notify('\nClosing position:');
      await options.notify(`Index Token: ${position.tokenSymbol}`);
      await options.notify(`Size: ${position.position.size} USD`);
      await options.notify(`Collateral: ${position.position.collateral} ${position.collateralSymbol}`);
      await options.notify(`Type: ${position.isLong ? 'Long' : 'Short'}`);

      // Get current price from Vault Price Feed
      const currentPrice = await options.evm.getProvider(146).readContract({
          address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
          abi: VaultPriceFeed,
          functionName: 'getPrice',
          args: [position.indexToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase() ? wrappedToken : position.indexToken as `0x${string}`, false, !position.isLong, true],
      }) as bigint;

      // Use consistent slippage approach (0.3% for both open and close)
      // For long positions: acceptablePrice = price * (1 - slippage) when closing
      // For short positions: acceptablePrice = price * (1 + slippage) when closing
      const slippageFactor = position.isLong ? (10000n - BigInt(slippageBps)) : (10000n + BigInt(slippageBps));
      const acceptablePrice = (currentPrice * slippageFactor) / 10000n;

      await options.notify(`Current Price: ${currentPrice.toString()}`);
      await options.notify(`Acceptable Price: ${acceptablePrice.toString()}`);
      await options.notify(`Slippage: ${slippageBps} bps`);

      // Encode the transaction data
      const data = encodeFunctionData({
          abi: PositionRouter,
          functionName: 'createDecreasePosition',
          args: [
              path,                                     // _path
              position.indexToken as `0x${string}`,     // _indexToken
              0n,                                       // _collateralDelta (0 for full close)
              parseUnits(position.position.size, 30),   // _sizeDelta (full position size)
              position.isLong,                          // _isLong
              account as `0x${string}`,                 // _receiver
              acceptablePrice,                          // _acceptablePrice
              0n,                                       // _minOut
              minExecutionFee,                          // _executionFee
              withdrawETH,                              // _withdrawETH
              callbackTarget as `0x${string}`           // _callbackTarget
          ],
      });

      transactions.push({
        target: CONTRACT_ADDRESSES[chainName].POSITION_ROUTER as `0x${string}`,
        data,
        value: minExecutionFee
      });
    }

    await options.notify('\nSending transaction(s)...');

    // Send the transactions
    const result = await options.evm.sendTransactions({
      chainId: 146,
      account: account as `0x${string}`,
      transactions
    });

    return toResult(JSON.stringify(result));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to close position: ${error.message}`, true);
    }
    return toResult('Failed to close position: Unknown error', true);
  }
};
