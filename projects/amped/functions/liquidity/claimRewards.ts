import { Address, getContract, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';

interface ClaimRewardsParams {
  chainName: string;
  account: Address;
  tokenAddress: Address;
}

/**
 * Claims rewards for a token
 * @param props - The claim rewards parameters
 * @param options - SDK function options
 * @returns Transaction hash if successful
 */
export async function claimRewards(
  { chainName, account, tokenAddress }: ClaimRewardsParams,
  { getProvider, notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Preparing to claim rewards...");

  const provider = getProvider(146); // Sonic chain ID
  const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER;

  try {
    const rewardTracker = getContract({
      address: rewardTrackerAddress,
      abi: RewardTracker,
      client: provider
    });

    // Check if there are rewards to claim
    const claimableAmount = await rewardTracker.read.claimable([account]) as bigint;
    
    if (claimableAmount <= 0n) {
      return toResult("No rewards available to claim", true);
    }

    await notify("Claiming rewards...");

    const tx: TransactionParams = {
      target: rewardTrackerAddress,
      data: encodeFunctionData({
        abi: RewardTracker,
        functionName: 'claim',
        args: [account]
      }),
      value: BigInt(0)
    };

    const result = await sendTransactions({
      chainId: 146, // Sonic chain ID
      account,
      transactions: [tx]
    });

    const claimMessage = result.data[result.data.length - 1];

    return toResult(
      result.isMultisig 
        ? claimMessage.message 
        : `Successfully claimed ${claimableAmount.toString()} rewards. ${claimMessage.message}`
    );
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to claim rewards: ${error.message}`, true);
    }
    return toResult("Failed to claim rewards: Unknown error", true);
  }
} 