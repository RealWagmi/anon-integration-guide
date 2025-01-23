import { ethers } from 'ethers';
import { Router } from '../../../abis/Router';
import { Vault } from '../../../abis/Vault';

export interface MarketSwapParams {
  signer: ethers.Signer;
  routerAddress: string;
  vaultAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: ethers.BigNumber;
  minAmountOut: ethers.BigNumber;
  receiver?: string;
}

export interface MarketSwapResult {
  amountIn: ethers.BigNumber;
  amountOut: ethers.BigNumber;
  transactionHash: string;
}

export async function marketSwap({
  signer,
  routerAddress,
  vaultAddress,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  receiver,
}: MarketSwapParams): Promise<MarketSwapResult> {
  const router = new ethers.Contract(routerAddress, Router, signer);
  const vault = new ethers.Contract(vaultAddress, Vault, signer);
  const account = await signer.getAddress();

  // Get expected output amount for slippage check
  const [expectedOut] = await vault.getAmountOut(tokenIn, tokenOut, amountIn);
  
  if (expectedOut.lt(minAmountOut)) {
    throw new Error('Insufficient output amount, slippage too high');
  }

  // Execute swap
  const tx = await router.swap(
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut,
    receiver || account
  );

  const receipt = await tx.wait();

  return {
    amountIn,
    amountOut: expectedOut,
    transactionHash: receipt.transactionHash
  };
} 