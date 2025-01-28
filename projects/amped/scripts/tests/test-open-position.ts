import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { openLongPositionWithValue } from '../../functions/trading/leverage/openMarketPosition.js';
import { ethers } from 'ethers';
import 'dotenv/config';

// Opening an $11 long position on ANON using $10 of S as collateral (1.1x leverage)
const indexToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;
const collateralToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  try {
    const result = await openLongPositionWithValue({
      signer,
      indexToken,
      collateralToken,
      collateralValueUsd: 10, // $10 USD of collateral (minimum allowed)
      positionValueUsd: 11, // $11 USD total position size (1.1x leverage, minimum allowed)
    });
    console.log('Position opened successfully:', result);
  } catch (error) {
    console.error('Error opening position:', error);
  }
}

main().catch(console.error); 
