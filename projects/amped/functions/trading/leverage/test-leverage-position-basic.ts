import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../../constants.js';
import { checkTokenLiquidity, openLongPosition } from './marketPosition.js';

async function testOpenAnonPosition() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  // Check liquidity for all tokens
  const tokens = [
    { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC },
    { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
    { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC },
    { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN }
  ];

  const liquidityResults = await Promise.all(
    tokens.map(token => checkTokenLiquidity(provider, token.address, token.symbol))
  );

  // Sort tokens by available USD liquidity
  const sortedLiquidity = liquidityResults
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .sort((a, b) => b.availableLiquidityUsd - a.availableLiquidityUsd);

  console.log('\nBest tokens for trading by liquidity:');
  sortedLiquidity.forEach(({ symbol, availableLiquidityUsd }) => {
    console.log(`${symbol}: $${availableLiquidityUsd}`);
  });

  // Analyze if ANON has enough liquidity for our trade
  const anonLiquidity = liquidityResults.find(result => result?.symbol === 'ANON');
  if (!anonLiquidity || anonLiquidity.availableLiquidityUsd < 20) {
    console.error('Insufficient liquidity for ANON. Need at least $20 for 2x leverage on $10');
    return;
  }

  try {
    // Open a long position on ANON using S as collateral
    const tx = await openLongPosition({
      signer,
      indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, // Trading ANON
      usdAmount: 10, // Using $10 worth of S as collateral
      leverage: 2 // 2x leverage
    });
    
    console.log('\nStep 1: Position Request Submitted');
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed');
    
    console.log('\nStep 2: Position Execution');
    console.log('IMPORTANT: The position request must be executed by a keeper within:');
    console.log('- 2 blocks (~6 seconds)');
    console.log('- 180 seconds');
    console.log('Otherwise, the position will be cancelled and funds returned (minus gas fees).');
    console.log('\nThis is to protect users from executing at stale prices.');
    console.log('You can monitor the position status:');
    console.log('1. Through the Sonic interface');
    console.log('2. By checking for ExecuteIncreasePosition or CancelIncreasePosition events');
  } catch (error) {
    console.error('Error opening position:', error);
  }
}

// Run the test
testOpenAnonPosition().catch(console.error); 