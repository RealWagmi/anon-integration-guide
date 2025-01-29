import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface TokenData {
    token: string;
    name: string;
    symbol: string;
    createdTimestamp: number;
}

interface ApiResponse {
    data: TokenData[];
}

interface Props {
    input: string;
}

/**
 * Fetches token address from name and symbol.
 * @param props - The search parameters. 
 * @returns Token address.
 */
export async function getTokenAddress({ input }: Props ): Promise<FunctionReturn> {
    if (!input || input.trim().length === 0) {
        return toResult('Provide a valid name or symbol.', true);
    }

    // Check if symbol
    const isSymbol = input.startsWith('$');
    const searchInput = isSymbol ? input.slice(1).trim() : input.trim();

    const response = await axios.get<ApiResponse>('https://api.gu.exchange/historical');

    // In case API fails
    if (!response.data.data || response.data.data.length === 0) {
        return toResult(`API didn't respond`, true);
    }

    let tokens = isSymbol
        ? response.data.data.filter((tokenData) => tokenData.symbol.toLowerCase() === searchInput.toLowerCase())
        : response.data.data.filter((tokenData) => tokenData.name.toLowerCase() === searchInput.toLowerCase());

    if (tokens.length === 0 && !isSymbol) {
        tokens = response.data.data.filter((tokenData) => tokenData.symbol.toLowerCase() === searchInput.toLowerCase());
    }

    if (tokens.length === 0) {
        return toResult(`Couldn't find token address for "${input}". Try again.`, true);
    }

    // Sort by timestamp and choose the oldest
    tokens.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const token = tokens[0];

    return toResult(`${token.token}`)
}