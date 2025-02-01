import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

interface Props {
  chainName: typeof NETWORKS[keyof typeof NETWORKS];
  account: Address;
}

/**
 * Gets earnings information for a user's staked tokens
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check earnings for
 * @param options - System tools for blockchain interactions
 * @returns Earnings information including claimable rewards, staked amount, and reward token price
 */
export async function getEarnings(
  { chainName, account }: Props,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Validate chain
  if (!Object.values(NETWORKS).includes(chainName)) {
    return toResult(`Network ${chainName} not supported`);
  }

  await notify("Checking earnings information...");

  try {
    const provider = getProvider(146); // Sonic chain ID
    const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_TRACKER;
    const fsAlpAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP;
    const nativeTokenAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
    const vaultPriceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;

    const rewardTracker = getContract({
      address: rewardTrackerAddress,
      abi: RewardTracker,
      client: provider
    });

    const fsAlp = getContract({
      address: fsAlpAddress,
      abi: RewardTracker,
      client: provider
    });

    const vaultPriceFeed = getContract({
      address: vaultPriceFeedAddress,
      abi: VaultPriceFeed,
      client: provider
    });

    const [claimableRewards, stakedAmount, rewardTokenPrice] = (await Promise.all([
      rewardTracker.read.claimable([account]),
      fsAlp.read.stakedAmounts([account]),
      vaultPriceFeed.read.getPrice([nativeTokenAddress, false, true, false])
    ])) as [bigint, bigint, bigint];

    // The price is returned with 30 decimals of precision
    const rewardTokenPriceUsd = rewardTokenPrice.toString();
    const rewardValueUsd = (claimableRewards * rewardTokenPrice) / (10n ** 30n);

    return toResult(JSON.stringify({
      claimableRewards: claimableRewards.toString(),
      stakedAmount: stakedAmount.toString(),
      rewardTokenPriceUsd,
      rewardValueUsd: rewardValueUsd.toString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to get earnings information: ${error.message}`, true);
    }
    return toResult("Failed to get earnings information: Unknown error", true);
  }
} 