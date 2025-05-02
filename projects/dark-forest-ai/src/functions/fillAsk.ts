import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import zeOTCAbi from '../abis/zeOTC.json';
import { OTC_ADDRESS, supportedChains } from '../constants';

interface Props {
  chainName: string;
  taker: Address;
  maker: Address;
  asset: Address;
  idx: string;
}

const { getChainFromName } = EVM.utils;

export async function fillAsk({ chainName, taker, maker, asset, idx }: Props, { evm }: FunctionOptions): Promise<FunctionReturn> {
  const chainId = getChainFromName(chainName as EvmChain);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId)) return toResult(`OTC is not supported on ${chainName}`, true);

  // Prepare transaction data
  const tx = {
    target: OTC_ADDRESS[chainId] as `0x${string}`,
    data: encodeFunctionData({
      abi: zeOTCAbi,
      functionName: 'fillAsk',
      args: [taker, maker, asset, BigInt(idx)],
    }),
  };

  try {
    const result = await evm.sendTransactions({ chainId, account: taker, transactions: [tx] });
    return toResult(`Ask filled. Tx: ${result.data?.[0]?.hash || 'unknown'}`);
  } catch (e: any) {
    return toResult(`Error filling ask: ${e.message || e}` , true);
  }
} 