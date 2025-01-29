import { ethers } from 'ethers';
import { NETWORKS, RPC_URLS, CONTRACT_ADDRESSES } from './constants.js';
import { printPosition } from './functions/trading/leverage/getPositions.js';
import { PositionRouter } from './abis/PositionRouter.js';

async function checkPosition() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const account = '0xb51e46987fb2aab2f94fd96bfe5d8205303d9c17';
  
  // First check current position
  await printPosition(provider, account);

  // Then check events from the transaction
  const positionRouter = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
    PositionRouter,
    provider
  );

  const txHash = '0xdd91ee0b08c0295989e3088e28eb5b0c55a84a45301da589a7d8ee0cfffc781b';
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log('\nTransaction Events:');
  for (const log of receipt.logs) {
    try {
      const parsed = positionRouter.interface.parseLog(log);
      console.log(`\nEvent: ${parsed.name}`);
      console.log('Args:', parsed.args);
    } catch (e) {
      // Skip logs that aren't from the PositionRouter
    }
  }
}

checkPosition().catch(console.error); 