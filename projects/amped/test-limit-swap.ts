import { parseEther } from 'viem';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';
import { limitSwap } from './functions/trading/swaps/limitSwap';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  // Create limit order to buy S when price drops 5% below current price
  const result = await limitSwap({
    tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    amountIn: parseEther('0.05'), // 0.05 USDC
    priceRatioBps: 9500, // 95% of current price
    slippageBps: 100, // 1% slippage
    executionFee: parseEther('0.001'), // 0.001 S
    shouldWrap: false,
    shouldUnwrap: false,
    privateKey: process.env.PRIVATE_KEY
  });

  // Log the result with calculated values
  console.log('Token In Price:', result.data.tokenInPrice?.toString());
  console.log('Token Out Price:', result.data.tokenOutPrice?.toString());
  console.log('Current Ratio:', result.data.currentRatio?.toString());
  console.log('Trigger Ratio:', result.data.triggerRatio?.toString());
  console.log('Expected Out:', result.data.expectedOut?.toString());
  console.log('Min Out:', result.data.minOut?.toString());
  console.log('Transaction Hash:', result.data.hash);
}

test().catch(console.error); 
