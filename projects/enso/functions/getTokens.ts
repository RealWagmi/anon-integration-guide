import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { ENSO_API, ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';

interface Props {
    chainName: string;
}

interface EnsoApiToken {
    chainId: number;
    address: string;
    decimals: number;
    type: string;
}

/**
 * Get tokens that are supported by Enso on specified chain
 * @param props - The function parameters
 * @returns List of protocols
 */
export async function getTokens({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        // NOTE: Not sure if page should be passed in from Props
        const url = `${ENSO_API}/tokens?chainId=${chainId}&page=1`;
        const res = await axios.get<{ data: EnsoApiToken[] }>(url, { headers: { Authorization: `Bearer ${ENSO_API_TOKEN}` } });

        // NOTE: Not sure if only address should be returned or address+symbol/address+name
        // as well. Maybe it is benefitial for the LLM to have name/symbol as well
        const tokens = res.data.data.map((token) => {
            return token.address;
        });

        return toResult(JSON.stringify(tokens));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching tokens from Enso API`, true);
    }
}
