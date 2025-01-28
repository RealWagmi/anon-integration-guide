import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Vault } from '../../../abis/Vault.js';
import { createPublicClient, http, getContract } from 'viem';
import { Chain } from 'viem/chains';

interface MarketPositionProps {
  chainName: string;
  account: `0x${string}`;
  indexToken: `0x${string}`;
  collateralToken: `0x${string}`;
  isLong: boolean;
  size: bigint;
  collateral: bigint;
  leverage: number;
  executionFee: bigint;
}

export const marketPosition = async (
  { chainName, account, indexToken, collateralToken, isLong, size, collateral, leverage, executionFee }: MarketPositionProps,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> => {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Opening market position...");

  const provider = getProvider(146); // Sonic chain ID
  const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
  const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;

  try {
    const client = createPublicClient({
      chain: provider.chain as Chain,
      transport: http()
    });

    const positionRouter = getContract({
      address: positionRouterAddress,
      abi: PositionRouter,
      client
    });

    const vault = getContract({
      address: vaultAddress,
      abi: Vault,
      client
    });

    // Validate position parameters
    const maxLeverage = await vault.read.maxLeverage();
    if (leverage > Number(maxLeverage)) {
      return toResult(`Leverage exceeds maximum allowed (${maxLeverage})`, true);
    }

    // Create position
    const tx = await positionRouter.write.createIncreasePosition(
      [collateralToken],
      indexToken,
      collateral,
      size,
      isLong,
      executionFee,
      { value: executionFee }
    );

    return toResult(JSON.stringify({
      transactionHash: tx,
      size,
      collateral,
      leverage
    }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return toResult(`Failed to open market position: ${error.message}`, true);
    }
    return toResult("Failed to open market position: Unknown error", true);
  }
}; 
