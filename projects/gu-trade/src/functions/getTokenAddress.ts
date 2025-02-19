import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface TokenData {
    token: string;
    name: string;
    symbol: string;
    createdTimestamp: number;
    creator: string;
    factory: string;
    lp: string;
    description: string;
    image: string;
    initialSupply: string;
    maxSupply: string;
    initialETHReserves: string;
    initialPrice: string;
    initialMarketCap: string;
    targetETH: string;
    id: string;
    totalSupply: string;
    isLPd: boolean;
    curveAllocation: string;
    events: {
        id: string;
        user: string;
        token: string;
        amount: string;
        totalSupply: string;
        amountOut: string;
        marketCap: string;
        price: string;
        reserveBalance: string;
        timestamp: number;
        event: string;
    }[];
}

interface ApiResponse {
    data: TokenData[];
}

interface Props {
    symbol: string;
}

/**
 * Fetches token address from name and symbol.
 * @param props - The search parameters. 
 * @returns Token address.
 */
export async function getTokenAddress({ symbol }: Props ): Promise<FunctionReturn> {
    if (!symbol || symbol.trim().length === 0) {
        return toResult('Provide a valid symbol.', true);
    }

    const searchInput = symbol.trim().toLowerCase();

    const response = await axios.get('https://api.gu.exchange/historical', {
        responseType: 'text',
    });

    const data: ApiResponse = JSON.parse(response.data);

    // In case API fails
    if (!data.data || data.data.length === 0) {
        return toResult(`API didn't respond with valid data.`, true);
    }

    const tokens = data.data.filter((tokenData) => 
        tokenData.symbol.toLowerCase() === searchInput
    );

    if (tokens.length === 0) {
        return toResult(`Couldn't find token address for "${symbol}". Try again.`, true);
    }

    // Sort by timestamp and choose the oldest
    tokens.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const token = tokens[0];

    return toResult(`${token.token}`)
}