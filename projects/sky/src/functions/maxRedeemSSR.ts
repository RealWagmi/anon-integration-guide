import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import { ssrAbi } from '../abis';
import { SSR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
}

const { getChainFromName } = EVM.utils;

export async function maxRedeemSSR({ chainName, account }: Props, { evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
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
