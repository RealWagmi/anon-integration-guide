import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface TokenData {
    creator: string;
    token: string;
    factory: string;
    lp: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    initialSupply: string;
    maxSupply: string;
    initialETHReserves: string;
    initialPrice: string;
    initialMarketCap: string;
    targetETH: string;
    createdTimestamp: number;
    id: string;
    totalSupply: string;
    isLPd: boolean;
    curveAllocation: string;
    events: any[];
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