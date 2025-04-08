import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';
import { EnsoClient } from '@ensofinance/sdk';

interface Props {
    chainName: string;
}

export interface EnsoApiProtocol {
    chains: { name: string; id: number }[];
    name: string | null;
    description: string | null;
    slug: string;
    url: string;
    logosUri: string[];
}

/**
 * Get protocols that are supported by Enso on specified chain
 * @param props - The function parameters
 * @returns List of protocol slugs
 */
export async function getEnsoSupportedProtocols({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const ensoClient = new EnsoClient({ apiKey: ENSO_API_TOKEN });
        const protocolData = await ensoClient.getProtocolData();

        const protocols: string[] = [];
        for (const protocol of protocolData) {
            const hasChain = protocol.chains.some((chain) => chain.id === chainId);
            if (hasChain) {
                protocols.push(protocol.slug);
            }
        }

        return toResult(JSON.stringify(protocols));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching protocols from Enso API`, true);
    }
}
