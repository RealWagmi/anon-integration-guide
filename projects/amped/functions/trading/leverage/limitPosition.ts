import { ethers } from 'ethers';
import { PositionRouter } from '../../../abis/PositionRouter';

export interface LimitPositionParams {
  signer: ethers.Signer;
  positionRouterAddress: string;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta: ethers.BigNumber;
  collateralDelta: ethers.BigNumber;
  triggerPrice: ethers.BigNumber;
  isIncrease: boolean;
  minOut?: ethers.BigNumber;
  executionFee?: ethers.BigNumber;
  withdrawETH?: boolean;
}

export interface LimitPositionResult {
  positionId: string;
  transactionHash: string;
}

export async function limitPosition({
  signer,
  positionRouterAddress,
  indexToken,
  collateralToken,
  isLong,
  sizeDelta,
  collateralDelta,
  triggerPrice,
  isIncrease,
  minOut = ethers.BigNumber.from(0),
  executionFee = ethers.utils.parseEther('0.001'), // Default execution fee
  withdrawETH = false,
}: LimitPositionParams): Promise<LimitPositionResult> {
  const positionRouter = new ethers.Contract(positionRouterAddress, PositionRouter, signer);
  const account = await signer.getAddress();

  // Create the limit position
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
      withdrawETH,
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

  // Get queue lengths to estimate execution time
  const [requestQueueLength, minRequestQueueLength] = await positionRouter.getRequestQueueLengths(positionId);
  
  return {
    positionId,
    transactionHash: receipt.transactionHash
  };
} 