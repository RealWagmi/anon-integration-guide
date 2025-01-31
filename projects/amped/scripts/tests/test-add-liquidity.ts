import { parseEther } from 'viem';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';
import { addLiquidity } from './functions/liquidity/addLiquidity';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  // Add liquidity with 0.1 native S token
  const result = await addLiquidity({
    token: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    amount: parseEther('0.1'),
    slippageBps: 100, // 1% slippage
    isNative: true,
    privateKey: process.env.PRIVATE_KEY
  });

  // Log the result with calculated values
  console.log('Token Price:', result.data.tokenPrice?.toString());
  console.log('USD Value:', result.data.usdValue?.toString());
  console.log('Min USDG:', result.data.minUsdg?.toString());
  console.log('Min GLP:', result.data.minGlp?.toString());
  console.log('Transaction Hash:', result.data.hash);
}

test().catch(console.error); 