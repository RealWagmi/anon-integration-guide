import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface ApiResponse {
    currentChainTvls: {
        ['IOTA EVM']: number;
    }
}

/**
 * Fetches current TVL.
 * @param props - The request parameters. 
 * @returns TVL.
 */
export async function getTvl(): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>(`https://api.llama.fi/protocol/deepr-finance`);

    if (!response.data || !response.data.currentChainTvls) {
        return toResult('No response from API', true);
    }

    const tvl = response.data.currentChainTvls['IOTA EVM'] / 1e6;

    return toResult(`Total value locked: $${tvl.toFixed(1)}M.`);
}