import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';

export interface GetSwapLiquidityParams {
  provider: ethers.providers.Provider;
  vaultAddress: string;
  tokenIn: string;
  tokenOut: string;
}

export interface SwapLiquidityResult {
  maxInAmount: ethers.BigNumber;
  maxOutAmount: ethers.BigNumber;
  poolAmount: ethers.BigNumber;
  reservedAmount: ethers.BigNumber;
}

export async function getSwapLiquidity({
  provider,
  vaultAddress,
  tokenIn,
  tokenOut,
}: GetSwapLiquidityParams): Promise<SwapLiquidityResult> {
  const vault = new ethers.Contract(vaultAddress, Vault, provider);

  // Get pool and reserved amounts for the output token
  const [poolAmount, reservedAmount] = await Promise.all([
    vault.poolAmounts(tokenOut),
    vault.reservedAmounts(tokenOut)
  ]);

  // Calculate available amount for swaps
  const availableAmount = poolAmount.sub(reservedAmount);

  // Get max in/out amounts based on available liquidity
  const maxOutAmount = availableAmount;
  const maxInAmount = await vault.getMaxPrice(tokenIn);

  return {
    maxInAmount,
    maxOutAmount,
    poolAmount,
    reservedAmount
  };
} 