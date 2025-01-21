import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API, ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';
import { EnsoApiProtocol } from './getProtocols';

interface Props {
    chainName: string;
    protocol: string;
}

/**
 * Search for a protocol by its slug on specified chain
 * @param props - The function parameters
 * @returns Protocol
 */
export async function getProtocol({ chainName, protocol }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!protocol) return toResult(`No protocol provided`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const url = `${ENSO_API}/protocols?slug=${protocol}`;
        const res = await axios.get<EnsoApiProtocol[]>(url, { headers: { Authorization: `Bearer ${ENSO_API_TOKEN}` } });

        if (res.data.length == 0) {
            return toResult(`Protocol ${protocol} not found`, true);
        }

        const protocolData = res.data[0];
        const isChainSupported = protocolData.chains.some((chain) => chain.id === chainId);
        if (!isChainSupported) return toResult(`Protocol ${protocol} is not supported on ${chainName}`, true);

        delete (protocolData as Partial<EnsoApiProtocol>).chains;
        return toResult(JSON.stringify(protocolData));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching protocol from Enso API`, true);
    }
}
