import { Type } from '@sinclair/typebox';
import { baseApiEndpoint } from './constants';
import { MinimalPairResponseItem, minimalPairsResponseSchema } from './schemas';
import { Value } from '@sinclair/typebox/value';

const minimalApiResponseSchema = Type.Object({
    success: Type.Boolean(),
    length: Type.Number(),
    data: minimalPairsResponseSchema,
});

export async function getMinimalPairs(): Promise<Map<string, MinimalPairResponseItem>> {
    try {
        const response = await fetch(`${baseApiEndpoint}/pairs/all/minimal`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();

        const parsedData = Value.Parse(minimalApiResponseSchema, rawData);

        if (!parsedData.success) {
            throw new Error('API response indicates failure');
        }

        return new Map(Object.entries(parsedData.data));
    } catch (error) {
        console.error('Error fetching minimal pairs:', error);
        return new Map();
    }
}
