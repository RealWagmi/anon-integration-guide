import { ethers } from 'ethers';
import { RewardTracker } from '../../abis/RewardTracker';

export interface ClaimRewardsParams {
  signer: ethers.Signer;
  rewardTrackerAddress: string;
  receiver?: string;
}

export interface ClaimRewardsResult {
  claimedAmount: ethers.BigNumber;
  transactionHash: string;
}

export async function claimRewards({
  signer,
  rewardTrackerAddress,
  receiver,
}: ClaimRewardsParams): Promise<ClaimRewardsResult> {
  const rewardTracker = new ethers.Contract(rewardTrackerAddress, RewardTracker, signer);
  const account = await signer.getAddress();

  // If no receiver specified, use the signer's address
  const rewardReceiver = receiver || account;

  // First get claimable amount for logging
  const claimableAmount = await rewardTracker.claimable(account);

  // Execute claim transaction
  const tx = await rewardTracker.claim(rewardReceiver);
  const receipt = await tx.wait();

  return {
    claimedAmount: claimableAmount,
    transactionHash: receipt.transactionHash
  };
} 