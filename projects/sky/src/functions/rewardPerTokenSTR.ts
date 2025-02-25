import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function rewardPerTokenSTR({ chainName }: Props, { evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const publicClient = getProvider(chainId);

	const rewardPerToken = await publicClient.readContract({
		address: STR_ADDRESS,
		abi: strAbi,
		functionName: 'rewardPerToken',
		args: [],
	});

	return toResult(`Current reward per staked token: ${formatUnits(rewardPerToken, 18)} SKY`);
}
