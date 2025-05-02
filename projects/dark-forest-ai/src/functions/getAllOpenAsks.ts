import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import zeOTCAbi from '../abis/zeOTC.json';
import { OTC_ADDRESS, supportedChains } from '../constants';

interface Props {
  chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function getAllOpenAsks({ chainName }: Props, { evm }: FunctionOptions): Promise<FunctionReturn> {
  const chainId = getChainFromName(chainName as EvmChain);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId)) return toResult(`OTC is not supported on ${chainName}`, true);

  const provider = evm.getProvider(chainId);

  try {
    const asks = await provider.readContract({
      address: OTC_ADDRESS[chainId] as `0x${string}`,
      abi: zeOTCAbi,
      functionName: 'getAllOpenAsks',
      args: [],
    });
    return toResult(JSON.stringify(asks));
  } catch (e: any) {
    return toResult(`Error fetching open asks: ${e.message || e}` , true);
  }
} 