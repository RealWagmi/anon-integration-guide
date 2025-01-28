import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';
import { EnsoClient } from '@ensofinance/sdk';
import { EnsoApiProtocol } from './getEnsoSupportedProtocols';

interface Props {
    chainName: string;
    protocol: string;
}

/**
 * Check if a protocol is supported by Enso by protocol's slug
 * @param props - The function parameters
 * @returns Protocol
 */
export async function isProtocolSupportedByEnso({ chainName, protocol }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!protocol) return toResult(`No protocol provided`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const ensoClient = new EnsoClient({
            apiKey: ENSO_API_TOKEN,
        });
        const protocolData = await ensoClient.getProtocolData({ slug: protocol });

        if (protocolData.length == 0) {
            return toResult(`Protocol ${protocol} not found`, true);
        }

        const isChainSupported = protocolData[0].chains.some((chain) => chain.id === chainId);
        if (!isChainSupported) return toResult(`Protocol ${protocol} is not supported on ${chainName}`, true);

        delete (protocolData[0] as Partial<EnsoApiProtocol>).chains;
        return toResult(JSON.stringify(protocolData));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching protocol from Enso API`, true);
    }
}
