import { Type } from '@sinclair/typebox';
import { baseApiEndpoint } from './constants';
import { ProtocolStatsResponse, protocolStatsSchema } from './schemas';
import { Value } from '@sinclair/typebox/value';

export const protocolStatsApiResponseSchema = Type.Object({
    success: Type.String(),
    data: protocolStatsSchema,
});

export async function getProtocolStats(): Promise<ProtocolStatsResponse | null> {
    try {
        const response = await fetch(`${baseApiEndpoint}/stats/equalizer`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();

        const parsedData = Value.Parse(protocolStatsApiResponseSchema, rawData);

        if (!parsedData.success) {
            throw new Error('API response indicates failure');
        }

        return parsedData.data;
    } catch (error) {
        console.error('Error fetching protocol stats:', error);
        return null;
    }
}
