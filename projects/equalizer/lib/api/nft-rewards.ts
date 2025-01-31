import { Type } from '@sinclair/typebox';
import { baseApiEndpoint } from './constants';
import { RewardByNFTResponseItem, rewardsByNftResponseSchema } from './schemas';
import { Value } from '@sinclair/typebox/value';

const nftRewardsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: rewardsByNftResponseSchema,
});

export async function getNftRewards(nftId: number): Promise<Map<string, RewardByNFTResponseItem>> {
    try {
        const response = await fetch(`${baseApiEndpoint}/nft/rewards/${nftId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();

        const parsedData = Value.Parse(nftRewardsResponseSchema, rawData);

        if (!parsedData.success) {
            throw new Error('API response indicates failure');
        }

        return new Map(Object.entries(parsedData.data));
    } catch (error) {
        console.error('Error fetching NFT rewards:', error);
        return new Map();
    }
}
