import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { POOLS, supportedChains, supportedPools } from '../constants';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	pool: string;
}

/**
 * Get supported tokens for a specific pool on a specific chain in Venus protocol.
 *
 * @param props - Parameters for getting supported tokens
 * @param options - System tools for blockchain interactions
 * @returns List of supported token symbols
 */
export async function getSupportedTokens({ chainName, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const { notify } = options;

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);

	// Validate pool
	if (!supportedPools.includes(pool)) {
		return toResult(`Unsupported pool: ${pool}. Available pools are: ${supportedPools.join(', ')}`, true);
	}

	try {
		await notify('Fetching supported tokens...');

		const poolTokens = POOLS[pool].poolTokens[chainId];
		if (!poolTokens) {
			return toResult(`No tokens found for ${pool} pool on ${chainName}`, true);
		}

		const tokenSymbols = Object.keys(poolTokens);
		return toResult(JSON.stringify(tokenSymbols));
	} catch (error) {
		return toResult(`Failed to get supported tokens: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
