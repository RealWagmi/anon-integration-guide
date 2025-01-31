import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';

interface LimitSwapParams {
  chainName: string;
  account: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  triggerPrice: bigint;
  triggerAboveThreshold: boolean;
  executionFee: bigint;
}

/**
 * Creates a limit swap order between two tokens
 * @param props - The limit swap parameters
 * @param options - SDK function options
 * @returns Transaction result
 */
export async function limitSwap(
  { chainName, account, tokenIn, tokenOut, amountIn, minAmountOut, triggerPrice, triggerAboveThreshold, executionFee }: LimitSwapParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Creating limit swap order...");

  const provider = getProvider(146); // Sonic chain ID
  const routerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER;

  try {
    const router = getContract({
      address: routerAddress,
      abi: Router,
      client: provider
    });

    // Create limit swap order
    const tx = await router.write.createSwapOrder(
      [tokenIn, tokenOut, amountIn, minAmountOut, triggerPrice, triggerAboveThreshold],
      { value: executionFee + (tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? amountIn : 0n) }
    );

    return toResult(JSON.stringify({
      transactionHash: tx,
      amountIn: amountIn.toString(),
      minAmountOut: minAmountOut.toString(),
      triggerPrice: triggerPrice.toString(),
      triggerAboveThreshold,
      executionFee: executionFee.toString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to create limit swap order: ${error.message}`, true);
    }
    return toResult("Failed to create limit swap order: Unknown error", true);
  }
} 