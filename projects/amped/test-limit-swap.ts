import { parseUnits } from 'viem';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';
import { limitSwap } from './functions/trading/swaps/limitSwap';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  const amountIn = parseUnits('0.05', 6); // 0.05 USDC with 6 decimals = 50000
  console.log('Input amount:', amountIn.toString(), '(6 decimals)');

  // Create limit order to buy S when price drops 5% below current price
  const result = await limitSwap({
    tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    tokenOut: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    amountIn,
    priceRatioBps: 9500, // 95% of current price
    slippageBps: 100, // 1% slippage
    executionFee: parseUnits('0.001', 18), // 0.001 S
    shouldWrap: false,
    shouldUnwrap: false,
    privateKey: process.env.PRIVATE_KEY
  });

  // Log the result with calculated values
  console.log('Debug - Raw values:');
  console.log('Token prices (30 decimals):');
  console.log('- USDC:', result.data.tokenInPrice?.toString());
  console.log('- S:', result.data.tokenOutPrice?.toString());
  console.log('Ratios:');
  console.log('- Current:', result.data.currentRatio?.toString());
  console.log('- Target:', result.data.triggerRatio?.toString());
  console.log('Expected Out:', result.data.expectedOut?.toString(), '(18 decimals)');
  console.log('Min Out:', result.data.minOut?.toString(), '(18 decimals)');
  console.log('Transaction Hash:', result.data.hash);
}

test().catch(console.error); 
