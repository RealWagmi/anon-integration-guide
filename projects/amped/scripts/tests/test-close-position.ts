import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants.js';
import { closeMarketPosition } from './functions/trading/leverage/closeMarketPosition.js';
import { getPosition } from './functions/trading/leverage/getPositions.js';

async function testClosePosition() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is required in .env file');
  }

  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const account = await signer.getAddress();

  console.log('Checking current position...');
  
  // Check the S token long position we found earlier
  const position = await getPosition(
    provider,
    account,
    CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, // S token as index
    CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, // S token as collateral
    true // long position
  );

  if (position.size === '0.0') {
    console.log('No active position found to close');
    return;
  }

  console.log('\nFound active position:');
  console.log('Size:', position.size);
  console.log('Collateral:', position.collateral);
  console.log('Average Price:', position.averagePrice);
  console.log('Has Profit:', position.hasProfit);
  console.log('Realized PnL:', position.realizedPnl);

  console.log('\nSubmitting close position request...');
  
  try {
    const tx = await closeMarketPosition({
      signer,
      indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      isLong: true,
      // Not specifying sizeDelta will close the entire position
      withdrawETH: true // withdraw as native token
    });

    console.log('\nStep 1: Close Position Request Submitted');
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for transaction confirmation...');
    await tx.wait();
    console.log('Transaction confirmed');
    
    console.log('\nStep 2: Position Execution');
    console.log('IMPORTANT: The close position request must be executed by a keeper within:');
    console.log('- 2 blocks (~6 seconds)');
    console.log('- 180 seconds');
    console.log('Otherwise, the request will be cancelled and funds returned (minus gas fees).');
    console.log('\nYou can monitor the position status:');
    console.log('1. Through the Sonic interface');
    console.log('2. By checking for ExecuteDecreasePosition or CancelDecreasePosition events');
    console.log('3. By running test-check-positions.ts again');
  } catch (error) {
    console.error('Error closing position:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testClosePosition().catch(console.error); 