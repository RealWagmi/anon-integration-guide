import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';

interface GetSwapLiquidityParams {
  chainName: string;
  account: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
}

/**
 * Gets swap liquidity information for a token pair
 * @param props - The liquidity check parameters
 * @param options - SDK function options
 * @returns Liquidity information
 */
export async function getSwapLiquidity(
  { chainName, account, tokenIn, tokenOut, amountIn }: GetSwapLiquidityParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking swap liquidity...");

  const provider = getProvider(146); // Sonic chain ID
  const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;

  try {
    const vault = getContract({
      address: vaultAddress,
      abi: Vault,
      client: provider
    });

    // Get pool and reserved amounts for the output token
    const [poolAmount, reservedAmount] = await Promise.all([
      vault.read.poolAmounts([tokenOut]),
      vault.read.reservedAmounts([tokenOut])
    ]);

    // Calculate available amount for swaps
    const availableAmount = poolAmount - reservedAmount;

    // Get max in/out amounts based on available liquidity
    const maxOutAmount = availableAmount;
    const maxInAmount = await vault.read.getMaxPrice([tokenIn]);

    // Get expected output amount
    const amountOut = await vault.read.getAmountOut([tokenIn, tokenOut, amountIn]);

    return toResult(JSON.stringify({
      maxInAmount: maxInAmount.toString(),
      maxOutAmount: maxOutAmount.toString(),
      poolAmount: poolAmount.toString(),
      reservedAmount: reservedAmount.toString(),
      expectedOut: amountOut.toString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get swap liquidity: ${error.message}`, true);
    }
    return toResult("Failed to get swap liquidity: Unknown error", true);
  }
} 