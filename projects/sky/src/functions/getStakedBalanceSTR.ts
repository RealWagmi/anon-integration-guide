import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function getStakedBalanceSTR({ chainName }: Props, { evm: { getProvider, getAddress } }: FunctionOptions): Promise<FunctionReturn> {
	const account = await getAddress();
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const publicClient = getProvider(chainId);

	const balance = await publicClient.readContract({
		address: STR_ADDRESS,
		abi: strAbi,
		functionName: 'balanceOf',
		args: [account],
	});

	return toResult(`Staked USDS balance: ${formatUnits(balance, 18)} USDS`);
}
