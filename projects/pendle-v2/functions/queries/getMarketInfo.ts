import { type Address } from 'viem';
import { type MarketInfo, type GetMarketInfoParams, type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress, validateChainName } from '../../utils/validation';

interface RewardData {
    pendlePerSec: bigint;
    accumulatedPendle: bigint;
    lastUpdated: bigint;
    incentiveEndsAt: bigint;
}

export async function getMarketInfo(
    params: GetMarketInfoParams,
    { getProvider }: { getProvider: () => any }
): Promise<Result<MarketInfo>> {
    try {
        const { chainName, marketAddress } = params;

        // Validate inputs
        validateChainName(chainName);
        validateAddress(marketAddress);

        const provider = getProvider();

        // Check if market is expired
        const isExpired = await provider.readContract({
            address: marketAddress,
            abi: [{
                name: 'isExpired',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'bool' }]
            }],
            functionName: 'isExpired',
            args: []
        }) as boolean;

        // Get reward data
        const rewardData = await provider.readContract({
            address: marketAddress,
            abi: [{
                name: 'rewardData',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{
                    type: 'tuple',
                    components: [
                        { name: 'pendlePerSec', type: 'uint256' },
                        { name: 'accumulatedPendle', type: 'uint256' },
                        { name: 'lastUpdated', type: 'uint256' },
                        { name: 'incentiveEndsAt', type: 'uint256' }
                    ]
                }]
            }],
            functionName: 'rewardData',
            args: []
        }) as RewardData;

        return {
            success: true,
            data: {
                isExpired,
                pendlePerSec: rewardData.pendlePerSec,
                accumulatedPendle: rewardData.accumulatedPendle,
                lastUpdated: rewardData.lastUpdated,
                incentiveEndsAt: rewardData.incentiveEndsAt
            }
        };
    } catch (error) {
        console.error('Error in getMarketInfo:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 