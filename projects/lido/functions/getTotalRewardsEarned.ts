import { Address, formatUnits } from 'viem';
import {
  FunctionReturn,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { fetchTotalRewardsApiEndpoint, supportedChains } from '../constants';

interface StEthInfoProps {
  chainName: string;
  account: Address;
}

/**
 * Fetches the total rewards earned by the user on Lido using sharesOf.
 */
export async function getTotalRewardsEarned(
  { chainName, account }: StEthInfoProps,
): Promise<FunctionReturn> {
  if (!account) return toResult('Wallet not connected', true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {

    const response = await fetch(`${fetchTotalRewardsApiEndpoint}/?address=${account}&onlyRewards=true`);
    if (!response.ok) {
      return toResult(`Failed to fetch total Rewards: ${response.statusText}`, true);
    }
    
    const data = await response.json();
    const totalRewards = data?.totals?.ethRewards;


    return toResult(
      `Total Rewards Earned: ${formatUnits(totalRewards, 18)} stETH`
    );
  } catch (error) {
    return toResult(
      `Failed to fetch total rewards: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
