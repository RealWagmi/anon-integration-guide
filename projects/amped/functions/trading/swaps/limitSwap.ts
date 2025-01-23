import { ethers } from 'ethers';
import { Router } from '../../../abis/Router';

export interface LimitSwapParams {
  signer: ethers.Signer;
  routerAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: ethers.BigNumber;
  minAmountOut: ethers.BigNumber;
  triggerPrice: ethers.BigNumber;
  triggerAboveThreshold: boolean;
  executionFee: ethers.BigNumber;
  shouldWrap?: boolean;
  shouldUnwrap?: boolean;
}

export interface LimitSwapResult {
  orderId: string;
  transactionHash: string;
}

export async function limitSwap({
  signer,
  routerAddress,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  triggerPrice,
  triggerAboveThreshold,
  executionFee,
  shouldWrap = false,
  shouldUnwrap = false,
}: LimitSwapParams): Promise<LimitSwapResult> {
  const router = new ethers.Contract(routerAddress, Router, signer);

  // Create the limit order
  const tx = await router.createSwapOrder(
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut,
    triggerPrice,
    triggerAboveThreshold,
    executionFee,
    shouldWrap,
    shouldUnwrap,
    { value: executionFee }
  );

  const receipt = await tx.wait();

  // Get the order ID from the event logs
  const orderId = receipt.events?.find(
    (e: any) => e.event === 'CreateSwapOrder'
  )?.args?.orderId;

  if (!orderId) {
    throw new Error('Failed to get order ID from transaction');
  }

  return {
    orderId,
    transactionHash: receipt.transactionHash
  };
} 