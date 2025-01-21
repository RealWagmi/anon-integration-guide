import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API, ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';
import { Address } from 'viem';
import { EnsoApiToken } from './getTokens';

interface Props {
    chainName: string;
    address: Address;
}

/**
 * Search for a token by its address
 * @param props - The function parameters
 * @returns Token
 */
export async function getToken({ chainName, address }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!address) return toResult('Token address not provided', true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const url = `${ENSO_API}/tokens?chainId=${chainId}&address=${address}&page=1`;
        const res = await axios.get<{ data: EnsoApiToken[] }>(url, { headers: { Authorization: `Bearer ${ENSO_API_TOKEN}` } });

        if (res.data.data.length === 0) {
            return toResult('Token not found', true);
        }

        return toResult(JSON.stringify(res.data.data[0]));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching token from Enso API`, true);
    }
}