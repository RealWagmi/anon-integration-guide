import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface ApiResponse {
    user: string;
    total: string;
}

interface Props {
    account: Address;
}

/**
 * Fetches user's points.
 * @param props - The request parameters. 
 * @returns User's points.
 */
export async function getUserPoints({ account }: Props): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>(`https://points-api.rings.money/points/${account}`);

    if (!response.data || !response.data.total) {
        return toResult('No response from API', true);
    }

    const points = response.data.total;

    return toResult(`Total points - ${points}.`);
}