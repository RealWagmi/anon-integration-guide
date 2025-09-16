import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { ssrAbi } from '../abis';
import { SSR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function maxRedeemSSR({ chainName }: Props, { evm: { getProvider, getAddress } }: FunctionOptions): Promise<FunctionReturn> {
	const account = await getAddress();
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const publicClient = getProvider(chainId);

	const maxRedeem = await publicClient.readContract({
		address: SSR_ADDRESS,
		abi: ssrAbi,
		functionName: 'maxRedeem',
		args: [account],
	});

	return toResult(`Maximum redeemable amount: ${formatUnits(maxRedeem, 18)} sUSDS`);
}
