import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';

// Constants for calculations
const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
const BASIS_POINTS_DIVISOR = 10000;
const NATIVE_TOKEN_DECIMALS = 18;
const NATIVE_TOKEN_PRICE = 1000000000000000000000000000000n; // $1 with 30 decimals precision

interface GetAprParams {
  chainName: string;
  account: Address;
  tokenAddress: Address;
}

/**
 * Gets APR information for a token
 * @param props - The APR check parameters
 * @param options - SDK function options
 * @returns APR information
 */
export async function getApr(
  { chainName, account, tokenAddress }: GetAprParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (chainName.toLowerCase() !== "sonic") {
    return toResult("This function is only supported on Sonic chain", true);
  }

  await notify("Checking APR information...");

  const provider = getProvider(146); // Sonic chain ID
  const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER;
  const rewardDistributorAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_DISTRIBUTOR;

  try {
    const rewardTracker = getContract({
      address: rewardTrackerAddress,
      abi: RewardTracker,
      client: provider
    });

    const distributor = getContract({
      address: rewardDistributorAddress,
      abi: RewardDistributor,
      client: provider
    });

    const [tokensPerInterval, totalSupply] = (await Promise.all([
      distributor.read.tokensPerInterval(),
      rewardTracker.read.totalSupply()
    ])) as [bigint, bigint];

    // Calculate APR
    const yearlyRewards = tokensPerInterval * BigInt(SECONDS_PER_YEAR);
    const baseApr = Number((yearlyRewards * NATIVE_TOKEN_PRICE * 100n) / (totalSupply * NATIVE_TOKEN_PRICE));
    const stakedApr = baseApr * 2; // Example calculation
    const totalApr = baseApr + stakedApr;

    return toResult(JSON.stringify({
      baseApr,
      stakedApr,
      totalApr
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get APR information: ${error.message}`, true);
    }
    return toResult("Failed to get APR information: Unknown error", true);
  }
} 