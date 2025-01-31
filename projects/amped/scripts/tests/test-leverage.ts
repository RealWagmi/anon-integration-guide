import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants';
import { getLeverageLiquidity } from './functions/trading/leverage/getLiquidity';
import { marketPosition } from './functions/trading/leverage/marketPosition';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  // Create provider and signer
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Check liquidity for a long position using USDC as collateral
  const liquidityInfo = await getLeverageLiquidity({
    provider,
    vaultAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, // S token as index
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  });

  console.log('Leverage Info:', {
    maxLeverage: liquidityInfo.maxLeverage,
    maxPositionSize: liquidityInfo.maxPositionSize.toString(),
    poolAmount: liquidityInfo.poolAmount.toString(),
    reservedAmount: liquidityInfo.reservedAmount.toString(),
    fundingRate: liquidityInfo.fundingRate.toString()
  });

  // Open a long position with 100 USDC collateral at 5x leverage
  const collateralAmount = ethers.utils.parseUnits('100', 6); // USDC has 6 decimals
  const leverage = 5;
  const sizeDelta = collateralAmount.mul(leverage);

  const result = await marketPosition({
    signer,
    vaultAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    positionRouterAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true,
    sizeDelta,
    collateralDelta: collateralAmount,
    isIncrease: true,
    triggerPrice: ethers.BigNumber.from(0),
    minOut: ethers.BigNumber.from(0),
    executionFee: ethers.utils.parseEther('0.001') // 0.001 S as execution fee
  });

  console.log('Position opened:', {
    positionId: result.positionId,
    transactionHash: result.transactionHash
  });
}

test().catch(console.error); 
