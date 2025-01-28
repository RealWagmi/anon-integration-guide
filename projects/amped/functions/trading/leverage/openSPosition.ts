import { Address, encodeFunctionData } from 'viem';
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { Router } from '../../../abis/Router.js';

interface OpenSPositionProps {
  chainName: string;
  account: Address;
  collateralValueUsd: number;
  positionValueUsd: number;
}

/**
 * Opens a long position on S token using S as collateral
 * @param props - The position parameters
 * @param options - SDK function options
 * @returns Transaction result
 */
export async function openSPosition(
  { chainName, account, collateralValueUsd, positionValueUsd }: OpenSPositionProps,
  { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  // Validate minimum amounts
  if (collateralValueUsd < 10) {
    return toResult("Minimum collateral value is $10 USD", true);
  }
  if (positionValueUsd < 11) {
    return toResult("Minimum position value is $11 USD", true);
  }

  // Calculate leverage
  const leverage = positionValueUsd / collateralValueUsd;
  if (leverage > 11) {
    return toResult("Maximum leverage is 11x", true);
  }
  if (leverage < 1.1) {
    return toResult("Minimum leverage is 1.1x", true);
  }

  await notify("Preparing to open S token position...");

  const provider = getProvider(146); // Sonic chain ID
  const txs: TransactionParams[] = [];

  try {
    // Get current S token price
    const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;
    const nativeTokenAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
    
    const priceResponse = await provider.readContract({
      address: priceFeedAddress,
      abi: VaultPriceFeed,
      functionName: "getPrice",
      args: [nativeTokenAddress, false, true, true]
    });

    const currentPrice = BigInt(priceResponse.toString());
    const priceInUsd = Number(currentPrice) / 1e30;

    // Calculate token amounts
    const collateralAmount = BigInt(Math.floor(collateralValueUsd / priceInUsd * 1e18));
    const sizeDelta = BigInt(Math.floor(positionValueUsd / priceInUsd * 1e30));

    // 1. Check if PositionRouter plugin needs approval
    const routerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER;
    const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;

    const isPluginApproved = await provider.readContract({
      address: routerAddress,
      abi: Router,
      functionName: "approvedPlugins",
      args: [account, positionRouterAddress]
    });

    if (!isPluginApproved) {
      const approveData = encodeFunctionData({
        abi: Router,
        functionName: "approvePlugin",
        args: [positionRouterAddress]
      });

      txs.push({
        target: routerAddress,
        data: approveData,
        value: BigInt(0)
      });
    }

    // 2. Create increase position transaction
    const acceptablePrice = (currentPrice * 101n) / 100n; // 1% buffer for longs
    const executionFee = BigInt(1e15); // 0.001 native token
    const path = [nativeTokenAddress];
    const referralCode = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const createPositionData = encodeFunctionData({
      abi: PositionRouter,
      functionName: "createIncreasePositionETH",
      args: [
        path,
        nativeTokenAddress,
        0n, // minOut
        sizeDelta,
        true, // isLong
        acceptablePrice,
        executionFee,
        referralCode,
        "0x0000000000000000000000000000000000000000" // callbackTarget
      ]
    });

    txs.push({
      target: positionRouterAddress,
      data: createPositionData,
      value: collateralAmount + executionFee
    });

    await notify("Opening S token position...");

    // Send transactions
    const result = await sendTransactions({
      chainId: 146, // Sonic chain ID
      account,
      transactions: txs
    });

    return toResult(
      result ? "Position opened successfully" : "Failed to open position",
      !result
    );
  } catch (error) {
    console.error("Error in openSPosition:", error);
    return toResult(error instanceof Error ? error.message : "Unknown error occurred", true);
  }
} 