import axios from 'axios';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface CreationData {
    id: string;
    token: string;
    name: string;
    symbol: string;
    image: string;
    userAddress: string;
    amount: string;
    distribution: number;
    targetETH: string;
    initialETHReserves: string;
    isLPd: boolean;
    createdTimestamp: number;
  }

interface ApiResponse {
    data: CreationData[];
}

/**
 * Fetches last created token.
 * @returns Last created token info.
 */
export async function getLastCreatedToken(): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>('https://api.gu.exchange/creations');

    const lastCreated = response.data.data[0];
    const { token, name, symbol } = lastCreated;

    return toResult(`The last created token is ${name}(${symbol}) with ${token} address.`)
}