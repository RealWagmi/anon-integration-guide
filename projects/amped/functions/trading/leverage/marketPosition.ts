import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';
import { PositionRouter } from '../../../abis/PositionRouter';

export interface MarketPositionParams {
  signer: ethers.Signer;
  vaultAddress: string;
  positionRouterAddress: string;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta: ethers.BigNumber;
  collateralDelta?: ethers.BigNumber;
  isIncrease: boolean;
  triggerPrice?: ethers.BigNumber;
  minOut?: ethers.BigNumber;
  executionFee?: ethers.BigNumber;
}

export interface MarketPositionResult {
  positionId: string;
  transactionHash: string;
}

export async function marketPosition({
  signer,
  vaultAddress,
  positionRouterAddress,
  indexToken,
  collateralToken,
  isLong,
  sizeDelta,
  collateralDelta = ethers.BigNumber.from(0),
  isIncrease,
  triggerPrice = ethers.BigNumber.from(0),
  minOut = ethers.BigNumber.from(0),
  executionFee = ethers.utils.parseEther('0.001'), // Default execution fee
}: MarketPositionParams): Promise<MarketPositionResult> {
  const vault = new ethers.Contract(vaultAddress, Vault, signer);
  const positionRouter = new ethers.Contract(positionRouterAddress, PositionRouter, signer);
  const account = await signer.getAddress();

  // Get current position info
  const [
    size,
    collateral,
    averagePrice,
    entryFundingRate,
    reserveAmount,
    realisedPnl,
    hasProfit,
    lastIncreasedTime
  ] = await vault.getPosition(account, collateralToken, indexToken, isLong);

  // Execute position change
  let tx;
  if (isIncrease) {
    tx = await positionRouter.createIncreasePosition(
      [collateralToken], // path
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      triggerPrice,
      minOut,
      executionFee,
      ethers.constants.HashZero, // referralCode
      { value: executionFee }
    );
  } else {
    tx = await positionRouter.createDecreasePosition(
      [collateralToken], // path
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      account, // receiver
      triggerPrice,
      minOut,
      executionFee,
      false, // withdrawETH
      { value: executionFee }
    );
  }

  const receipt = await tx.wait();

  // Get the position ID from the event logs
  const eventName = isIncrease ? 'CreateIncreasePosition' : 'CreateDecreasePosition';
  const positionId = receipt.events?.find(
    (e: any) => e.event === eventName
  )?.args?.positionId;

  if (!positionId) {
    throw new Error('Failed to get position ID from transaction');
  }

  return {
    positionId,
    transactionHash: receipt.transactionHash
  };
} 