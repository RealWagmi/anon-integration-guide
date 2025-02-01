import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, PRECISION, SECONDS_PER_YEAR, BASIS_POINTS_DIVISOR } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';

interface Props {
  chainName: typeof NETWORKS[keyof typeof NETWORKS];
  account: Address;
}

/**
 * Gets APR information for ALP (Amped Liquidity Provider) tokens
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check APR for
 * @param options - System tools for blockchain interactions
 * @returns APR information including base APR and reward rates
 */
export async function getALPAPR(
  { chainName, account }: Props,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (!Object.values(NETWORKS).includes(chainName)) {
    return toResult(`Network ${chainName} not supported`);
  }

  await notify("Checking ALP APR information...");

  try {
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
    if (error instanceof Error) {
      return toResult(`Failed to get ALP APR information: ${error.message}`, true);
    }
    return toResult("Failed to get ALP APR information: Unknown error", true);
  }
} 