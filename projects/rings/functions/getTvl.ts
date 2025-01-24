import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface ApiResponse {
    currentChainTvls: {
        Sonic: number;
    }
}

/**
 * Fetches current TVL.
 * @param props - The request parameters. 
 * @returns TVL.
 */
export async function getTvl(): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>(`https://api.llama.fi/protocol/rings`);

    if (!response.data || !response.data.currentChainTvls) {
        return toResult('No response from API', true);
    }

    const tvl = response.data.currentChainTvls.Sonic;

    return toResult(`Total value locked on Sonic - $${tvl}.`);
}