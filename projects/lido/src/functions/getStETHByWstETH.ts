import { formatUnits, Address, parseEther } from 'viem';
import { supportedChains, wstETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface StEthInfoProps {
  chainName: string;
  account: Address;
  amount: string; 
}

/**
 * Converts wstETH to stETH value.
 */
export async function getStETHByWstETH( { chainName, amount }: StEthInfoProps,  options: FunctionOptions): Promise<FunctionReturn> {
  
  const {
		evm: { getProvider },
	} = options;
  try {
    if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toResult('Amount must be a valid number greater than 0', true);
    }
  
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId || !supportedChains.includes(chainId)) {
      return toResult(`Lido protocol is not supported on ${chainName}`, true);
    }
    
    const publicClient = getProvider(chainId);
    if (!publicClient) {
      return toResult(`Failed to get provider for chain: ${chainName}`, true);
    }
    const amountInWei = parseEther(amount);
    const stEthAmount = (await publicClient.readContract({
      address: wstETH_ADDRESS,
      abi: wstETHAbi,
      functionName: 'getStETHByWstETH',
      args: [amountInWei],
    })) as bigint;

    return toResult(`Equivalent stETH: ${formatUnits(stEthAmount, 18)} stETH`);
  } catch (error) {
    return toResult(
      `Failed to convert wstETH to stETH: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
