import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';

interface GetEarningsParams {
  chainName: string;
  account: Address;
  tokenAddress: Address;
}

/**
 * Gets earnings information for a token
 * @param props - The earnings check parameters
 * @param options - SDK function options
 * @returns Earnings information
 */
export async function getEarnings(
  { chainName, account, tokenAddress }: GetEarningsParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking earnings information...");

  const provider = getProvider(146); // Sonic chain ID
  const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER;

  try {
    const rewardTracker = getContract({
      address: rewardTrackerAddress,
      abi: RewardTracker,
      client: provider
    });

    const [claimableRewards, stakedAmount] = (await Promise.all([
      rewardTracker.read.claimable([account]),
      rewardTracker.read.stakedAmounts([account])
    ])) as [bigint, bigint];

    return toResult(JSON.stringify({
      claimableRewards: claimableRewards.toString(),
      stakedAmount: stakedAmount.toString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get earnings information: ${error.message}`, true);
    }
    return toResult("Failed to get earnings information: Unknown error", true);
  }
} 