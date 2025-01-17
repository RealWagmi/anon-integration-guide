import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API, ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';

interface Props {
    chainName: string;
}

interface EnsoApiProtocol {
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
 * @returns List of protocols
 */
export async function getProtocols({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const url = `${ENSO_API}/protocols`;
        const res = await axios.get<EnsoApiProtocol[]>(url, { headers: { Authorization: `Bearer ${ENSO_API_TOKEN}` } });

        const protocols: string[] = [];
        for (const protocol of res.data) {
            const hasChain = protocol.chains.some((chain) => chain.id === chainId);
            if (hasChain && protocol.name) {
                protocols.push(protocol.name);
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
