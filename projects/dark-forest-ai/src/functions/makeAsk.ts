import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, parseUnits, encodeFunctionData } from 'viem';
import zeOTCAbi from '../abis/zeOTC.json';
import { OTC_ADDRESS, supportedChains } from '../constants';

interface Ask {
  maker: Address;
  amountHave: string;
  amountWant: string;
  have: Address;
  want: Address;
  deadline: string;
  index: string;
}

interface Props {
  chainName: string;
  ask: Ask;
}

const { getChainFromName } = EVM.utils;

export async function makeAsk({ chainName, ask }: Props, { evm }: FunctionOptions): Promise<FunctionReturn> {
  const chainId = getChainFromName(chainName as EvmChain);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId)) return toResult(`OTC is not supported on ${chainName}`, true);

  // Convert string values to BigInt where needed
  const askForContract = {
    ...ask,
    amountHave: parseUnits(ask.amountHave, 18),
    amountWant: parseUnits(ask.amountWant, 18),
    deadline: BigInt(ask.deadline),
    index: BigInt(ask.index),
  };

  // Prepare transaction data
  const tx = {
    target: OTC_ADDRESS[chainId] as `0x${string}`,
    data: encodeFunctionData({
      abi: zeOTCAbi,
      functionName: 'makeAsk',
      args: [askForContract, ask.maker],
    }),
  };

  try {
    const result = await evm.sendTransactions({ chainId, account: ask.maker, transactions: [tx] });
    return toResult(`Ask created. Tx: ${result.data?.[0]?.hash || 'unknown'}`);
  } catch (e: any) {
    return toResult(`Error creating ask: ${e.message || e}` , true);
  }
} 