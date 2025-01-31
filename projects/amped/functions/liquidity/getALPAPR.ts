import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, PRECISION } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';

// Constants for calculations
const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
const BASIS_POINTS_DIVISOR = 10000;

interface GetALPAPRParams {
  chainName: string;
  account: Address;
  tokenAddress: Address;
}

/**
 * Gets APR information for ALP (Amped Liquidity Provider) tokens
 * @param props - The APR check parameters
 * @param props.chainName - The name of the chain (e.g., "sonic")
 * @param props.account - The account address to check APR for
 * @param props.tokenAddress - The ALP token address
 * @param options - SDK function options
 * @param options.getProvider - Function to get the provider for a chain
 * @param options.notify - Function to send notifications
 * @returns APR information including base APR
 */
export async function getALPAPR(
  { chainName, account, tokenAddress }: GetALPAPRParams,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    await notify("Checking ALP APR information...");

    const provider = getProvider(146); // Sonic chain ID
    const glpTokenAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN;
    const rewardDistributorAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_DISTRIBUTOR;

    // Initialize contracts
    const glpContract = getContract({
      address: glpTokenAddress,
      abi: RewardTracker,
      client: provider
    });

    const distributor = getContract({
      address: rewardDistributorAddress,
      abi: RewardDistributor,
      client: provider
    });

    await notify("Fetching total supply...");
    const totalSupply = await glpContract.read.totalSupply();

    await notify("Fetching tokens per interval...");
    const tokensPerInterval = await distributor.read.tokensPerInterval();

    // Calculate yearly rewards
    const yearlyRewards = tokensPerInterval * BigInt(SECONDS_PER_YEAR);
    
    // Calculate base APR (using PRECISION for better accuracy)
    const baseApr = Number((yearlyRewards * BigInt(PRECISION) * 100n) / totalSupply) / PRECISION;

    await notify("APR calculation completed");

    return toResult(JSON.stringify({
      baseApr: baseApr.toFixed(2),
      yearlyRewards: yearlyRewards.toString(),
      totalSupply: totalSupply.toString(),
      tokensPerInterval: tokensPerInterval.toString()
    }));
  } catch (error) {
    // Log error for debugging but don't expose internal details to user
    console.error('Error in getALPAPR:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.includes('out of gas') 
        ? 'Failed to fetch reward rate. Please try again.'
        : `Failed to get ALP APR information: ${error.message}`;
      return toResult(errorMessage, true);
    }
    return toResult("Failed to get ALP APR information. Please try again.", true);
  }
} 