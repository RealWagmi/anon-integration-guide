import { ethers } from 'ethers';
import 'dotenv/config';
import { NETWORKS, RPC_URLS } from './constants.js';
import { testLeveragePosition } from './functions/trading/leverage/marketPosition.js';

async function testOpenPosition() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  try {
    // Open a position with $10 collateral and 2.5x leverage
    const tx = await testLeveragePosition(signer, 10, 2.5);
    
    console.log('\nStep 1: Position Request Submitted');
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for transaction confirmation...');
    await tx.wait();
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
testOpenPosition().catch(console.error); 