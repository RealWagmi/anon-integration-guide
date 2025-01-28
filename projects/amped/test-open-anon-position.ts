import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants.js';
import { openLongPositionWithValue } from './functions/trading/leverage/openMarketPosition.js';
import { ethers } from 'ethers';
import 'dotenv/config';

// Opening a $15 long position on S using $10 of S as collateral (1.5x leverage)
const indexToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
const collateralToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  try {
    const result = await openLongPositionWithValue({
      signer,
      indexToken,
      collateralToken,
      collateralValueUsd: 10, // $10 USD of collateral
      positionValueUsd: 15, // $15 USD total position size (1.5x leverage)
    });
    console.log('Position opened successfully:', result);
  } catch (error) {
    console.error('Error opening position:', error);
  }
}

main().catch(console.error); 