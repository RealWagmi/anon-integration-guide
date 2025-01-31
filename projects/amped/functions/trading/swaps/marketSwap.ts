import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';

interface MarketSwapParams {
  chainName: string;
  account: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
}

/**
 * Executes a market swap between two tokens
 * @param props - The swap parameters
 * @param options - SDK function options
 * @returns Transaction result
 */
export async function marketSwap(
  { chainName, account, tokenIn, tokenOut, amountIn, minAmountOut }: MarketSwapParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Preparing market swap...");

  const provider = getProvider(146); // Sonic chain ID
  const routerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER;

  try {
    const router = getContract({
      address: routerAddress,
      abi: Router,
      client: provider
    });

    // Execute swap
    const tx = await router.write.swap(
      [tokenIn, tokenOut, amountIn, minAmountOut, account],
      { value: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? amountIn : 0n }
    );

    return toResult(JSON.stringify({
      transactionHash: tx,
      amountIn: amountIn.toString(),
      minAmountOut: minAmountOut.toString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to execute market swap: ${error.message}`, true);
    }
    return toResult("Failed to execute market swap: Unknown error", true);
  }
} 