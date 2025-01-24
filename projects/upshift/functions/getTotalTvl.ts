import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface ApiResponse {
    currentChainTvls: {
        Ethereum: number;
        Base: number;
        Avalanche: number;
    }
}

/**
 * Fetches current TVL across networks.
 * @param props - The request parameters. 
 * @returns TVL.
 */
export async function getTvl(): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>(`https://api.llama.fi/protocol/upshift`);

    if (!response.data || !response.data.currentChainTvls) {
        return toResult('No response from API', true);
    }

    const ethereumTvl = response.data.currentChainTvls.Ethereum / 1e6;
    const baseTvl = response.data.currentChainTvls.Base / 1e6;
    const avalancheTvl = response.data.currentChainTvls.Avalanche / 1e6;

    return toResult(`Total value locked:
        Ethereum - $${ethereumTvl.toFixed(1)}M;
        Base -  $${baseTvl.toFixed(1)}M;
        Base -  $${avalancheTvl.toFixed(1)}M;
        Total - $${(ethereumTvl + baseTvl + avalancheTvl).toFixed(1)}M.`);
}