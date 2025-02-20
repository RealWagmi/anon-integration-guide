import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import axios from 'axios';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    // No props needed for getSupportedChains as per original implementation
}

interface ChainInfo {
    chainId: string;
    originalChainId: string;
    chainName: string;
}

interface SupportedChainsResponse {
    chains: ChainInfo[];
}

/**
 * Get a list of all chains supported by DeBridge protocol.
 * @param props - No parameters required
 * @param tools - System tools for blockchain interactions
 * @returns List of supported chains with their IDs and names
 */
export async function getSupportedChains({}: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        await notify('Fetching supported chains from DeBridge...');

        const url = `${DEBRIDGE_API_URL}/supported-chains-info`;
        
        const response = await axios.get(url);
        if (response.status !== 200) {
            return toResult(`Failed to fetch supported chains: ${response.statusText}`, true);
        }

        const data = response.data as SupportedChainsResponse;
        if ('error' in data) {
            return toResult(`API Error: ${data.error}`, true);
        }

        // Format the response message
        const chainList = data.chains
            .map(chain => `${chain.chainName} (ID: ${chain.chainId}, Original ID: ${chain.originalChainId})`)
            .join('\n');

        return toResult(`Supported chains:\n${chainList}`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return toResult(`Failed to get supported chains: ${error.message}`, true);
        }
        return toResult(`Failed to get supported chains: ${error}`, true);
    }
}
