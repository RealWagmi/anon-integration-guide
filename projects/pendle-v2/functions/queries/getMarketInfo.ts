import { type Address } from 'viem';
import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, ADDRESSES } from '../../constants';
import { marketAbi, gaugeControllerAbi, marketFactoryAbi } from '../../abis';
import { MarketInfo } from '../../types';
import { handleError, PendleError, ERRORS } from '../../utils/errors';
import { validateChain, validateMarket } from '../../utils/validation';
import { provider } from '../../utils/provider';

interface Props {
    chainName: string;
    marketAddress: Address;
}

interface RewardData {
    pendlePerSec: bigint;
    accumulatedPendle: bigint;
    lastUpdated: bigint;
    incentiveEndsAt: bigint;
}

export async function getMarketInfo({
    chainName,
    marketAddress
}: Props): Promise<FunctionReturn> {
    try {
        const chainId = getChainFromName(chainName);

        try {
            const isExpired = await provider.readContract({
                address: marketAddress,
                abi: marketAbi,
                functionName: 'isExpired'
            }) as boolean;

            const rewardData = await provider.readContract({
                address: marketAddress,
                abi: marketAbi,
                functionName: 'rewardData'
            }) as RewardData;

            const result = {
                isExpired,
                pendlePerSec: rewardData.pendlePerSec.toString(),
                accumulatedPendle: rewardData.accumulatedPendle.toString(),
                lastUpdated: rewardData.lastUpdated.toString(),
                incentiveEndsAt: rewardData.incentiveEndsAt.toString()
            };
            return { success: true, data: JSON.stringify(result) };
        } catch (error: any) {
            return { success: false, data: `ERROR: Invalid market address: ${marketAddress}` };
        }
    } catch (error: any) {
        return { success: false, data: `ERROR: ${error.message}` };
    }
} 