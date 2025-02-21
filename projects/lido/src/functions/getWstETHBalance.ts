import { Address, formatUnits } from 'viem';
import {
  FunctionReturn,
  FunctionOptions,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, wstETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';

interface StEthInfoProps {
  chainName: string;
  account: Address;
}

/**
 * Fetches the user's wstETH balance.
 */
export async function getWstETHBalance(
  { chainName, account }: StEthInfoProps,
  { getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult('Wallet not connected', true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    const publicClient = getProvider(chainId);
    const balance = (await publicClient.readContract({
      address: wstETH_ADDRESS,
      abi: wstETHAbi,
      functionName: 'balanceOf',
      args: [account],
    })) as bigint;

    return toResult(`wstETH Balance: ${formatUnits(balance, 18)} wstETH`);
  } catch (error) {
    return toResult(
      `Failed to fetch wstETH balance: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
