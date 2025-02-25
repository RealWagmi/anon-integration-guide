import { EVM, EvmChain, FunctionReturn, toResult } from '@heyanon/sdk';
import { fetchLidoAPRApiUrl, supportedChains } from '../constants';
const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string; // Name of the blockchain network (e.g., "Ethereum")
}

/**
 * Fetches the latest Lido APR from the official Lido API.
 */
export async function getLidoAPR({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId || !supportedChains.includes(chainId)) {
        return toResult(`Lido protocol is not supported on ${chainName}`, true);
    }

    try {
        const response = await fetch(fetchLidoAPRApiUrl);
        if (!response.ok) {
            return toResult(`Failed to fetch Lido APR: ${response.statusText}`, true);
        }

        const data = await response.json();
        const apr = data?.data?.apr;

        return toResult(`Current Lido APR: ${apr.toFixed(2)}%`);
    } catch (error) {
        return toResult(`Failed to fetch Lido APR: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
