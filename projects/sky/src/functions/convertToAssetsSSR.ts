import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits, parseUnits } from 'viem';
import { ssrAbi } from '../abis';
import { SSR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

const { getChainFromName } = EVM.utils;

export async function convertToAssetsSSR({ chainName, amount }: Props, { evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const amountInWei = parseUnits(amount, 18);
	if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

	const publicClient = getProvider(chainId);

	const assets = await publicClient.readContract({
		address: SSR_ADDRESS,
		abi: ssrAbi,
		functionName: 'convertToAssets',
		args: [amountInWei],
	});

	return toResult(`${amount} sUSDS = ${formatUnits(assets, 18)} USDS`);
}
