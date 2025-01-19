import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, toResult } from '@heyanon/sdk';

interface ApiResponse {
    time: string;
    value: {
        total: {
            kernelPoints: string;
            kernelPointsForLastDay: string;
        };
    };
}

interface Props {
    account: Address;
}

/**
 * Fetches user's points.
 * @param props - The request parameters. 
 * @returns Last created token info.
 */
export async function getUserPoints({ account }: Props): Promise<FunctionReturn> {
    const response = await axios.get<ApiResponse>(`https://common.kerneldao.com/points/${account}`);

    if (!response.data || !response.data.value || !response.data.value.total) {
        return toResult('No response from API', true);
    }

    const points = response.data.value.total.kernelPoints;

    return toResult(`Total points - ${points}.`);
}