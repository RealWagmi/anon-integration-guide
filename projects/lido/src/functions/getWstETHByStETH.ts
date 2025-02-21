import { formatUnits, Address, parseEther } from 'viem';
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
  amount: string; // Amount to wrap/unwrap
}

/**
 * Converts stETH to wstETH value.
 */
export async function getWstETHByStETH(
  { chainName, amount }: StEthInfoProps,
  { getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  if (!amount) return toResult('Invalid amount.', true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    const publicClient = getProvider(chainId);
    const amountInWei = parseEther(amount);
    const wstEthAmount = (await publicClient.readContract({
      address: wstETH_ADDRESS,
      abi: wstETHAbi,
      functionName: 'getWstETHByStETH',
      args: [amountInWei],
    })) as bigint;

    return toResult(
      `Equivalent wstETH: ${formatUnits(wstEthAmount, 18)} wstETH`
    );
  } catch (error) {
    return toResult(
      `Failed to convert stETH to wstETH: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
