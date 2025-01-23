import { ethers } from 'ethers';
import { RewardTracker } from '../../abis/RewardTracker';

export interface GetEarningsParams {
  provider: ethers.providers.Provider;
  rewardTrackerAddress: string;
  account: string;
}

export interface EarningsResult {
  claimableRewards: ethers.BigNumber;
  stakedAmount: ethers.BigNumber;
}

export async function getEarnings({
  provider,
  rewardTrackerAddress,
  account,
}: GetEarningsParams): Promise<EarningsResult> {
  const rewardTracker = new ethers.Contract(rewardTrackerAddress, RewardTracker, provider);

  const [claimableRewards, stakedAmount] = await Promise.all([
    rewardTracker.claimable(account),
    rewardTracker.stakedAmounts(account)
  ]);

  return {
    claimableRewards,
    stakedAmount
  };
} 