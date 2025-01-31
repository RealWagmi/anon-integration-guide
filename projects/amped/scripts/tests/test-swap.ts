import { parseEther } from 'viem';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';
import { marketSwap } from './functions/trading/swaps/marketSwap';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  // Swap 0.01 ANON for USDC
  const result = await marketSwap({
    tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    amountIn: parseEther('0.01'),
    slippageBps: 100, // 1% slippage
    privateKey: process.env.PRIVATE_KEY
  });

  // Log the result with calculated values
  console.log('Token In Price:', result.data.tokenInPrice?.toString());
  console.log('Token Out Price:', result.data.tokenOutPrice?.toString());
  console.log('USD Value:', result.data.usdValue?.toString());
  console.log('Expected Out:', result.data.expectedOut?.toString());
  console.log('Min Out:', result.data.minOut?.toString());
  console.log('Transaction Hash:', result.data.hash);
}

test().catch(console.error); 