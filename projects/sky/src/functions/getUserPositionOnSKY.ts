import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { ssrAbi, strAbi } from '../abis';
import { SSR_ADDRESS, STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function getUserPositionOnSKY({ chainName }: Props, { evm: { getProvider, getAddress } }: FunctionOptions): Promise<FunctionReturn> {
	const account = await getAddress();
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const publicClient = getProvider(chainId);

	// Get STR data
	const [stakedBalance, earnedRewards] = await Promise.all([
		publicClient.readContract({
			address: STR_ADDRESS,
			abi: strAbi,
			functionName: 'balanceOf',
			args: [account],
		}),
		publicClient.readContract({
			address: STR_ADDRESS,
			abi: strAbi,
			functionName: 'earned',
			args: [account],
		}),
	]);

	// Get SSR data
	const maxWithdraw = await publicClient.readContract({
		address: SSR_ADDRESS,
		abi: ssrAbi,
		functionName: 'maxWithdraw',
		args: [account],
	});

	return toResult(
		`Sky Protocol Position:\n` +
			`STR:\n` +
			`- Staked USDS: ${formatUnits(stakedBalance, 18)} USDS\n` +
			`- Pending SKY rewards: ${formatUnits(earnedRewards, 18)} SKY\n` +
			`SSR:\n` +
			`- Available to withdraw: ${formatUnits(maxWithdraw, 18)} USDS`,
	);
}
