import { EVM, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains } from '../constants';

const { getChainName } = EVM.utils;

export async function getSkySupportedChains(): Promise<FunctionReturn> {
	const skySupportedChains = supportedChains.map((chainId) => ({
		chainId,
		chainName: getChainName(chainId),
	}));

	return toResult(JSON.stringify(skySupportedChains));
}
