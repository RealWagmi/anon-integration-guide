import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { gaugeControllerAbi } from '../../abis';

export interface RewardData {
    pendlePerSec: string;
    accumulatedPendle: string;
    lastUpdated: string;
    incentiveEndsAt: string;
}

export async function fundPendle(
    amount: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        const provider = getProvider();
        const txParams = {
            abi: gaugeControllerAbi,
            functionName: 'fundPendle',
            args: [amount]
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully funded PENDLE');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function withdrawPendle(
    amount: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        const provider = getProvider();
        const txParams = {
            abi: gaugeControllerAbi,
            functionName: 'withdrawPendle',
            args: [amount]
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully withdrew PENDLE');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getPendleAddress(
    { getProvider }: { getProvider: Function }
): Promise<Result<Address>> {
    try {
        const provider = getProvider();
        const params = {
            abi: gaugeControllerAbi,
            functionName: 'pendle'
        };

        const result = await provider.readContract(params);
        return {
            success: true,
            data: result as Address
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemMarketReward(
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        const provider = getProvider();
        const txParams = {
            abi: gaugeControllerAbi,
            functionName: 'redeemMarketReward'
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully redeemed market reward');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getRewardData(
    pool: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<RewardData>> {
    try {
        validateAddress(pool);

        const provider = getProvider();
        const params = {
            abi: gaugeControllerAbi,
            functionName: 'rewardData',
            args: [pool]
        };

        const result = await provider.readContract(params);
        return {
            success: true,
            data: {
                pendlePerSec: result[0].toString(),
                accumulatedPendle: result[1].toString(),
                lastUpdated: result[2].toString(),
                incentiveEndsAt: result[3].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 