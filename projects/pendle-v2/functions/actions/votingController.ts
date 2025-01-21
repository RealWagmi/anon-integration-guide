import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { votingControllerAbi } from '../../abis';

export interface WeekData {
    isEpochFinalized: boolean;
    totalVotes: string;
    poolVotes: string[];
}

export interface VoteParams {
    pools: Address[];
    weights: number[];
}

export async function vote(
    params: VoteParams,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        // Validate all pool addresses
        params.pools.forEach(validateAddress);

        // Validate weights sum to 100%
        const totalWeight = params.weights.reduce((a, b) => a + b, 0);
        if (totalWeight !== 100) {
            throw new ValidationError('Vote weights must sum to 100');
        }

        const provider = getProvider();
        const txParams = {
            abi: votingControllerAbi,
            functionName: 'vote',
            args: [params.pools, params.weights]
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully submitted votes');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function applyPoolSlopeChanges(
    pool: Address,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        validateAddress(pool);

        const provider = getProvider();
        const txParams = {
            abi: votingControllerAbi,
            functionName: 'applyPoolSlopeChanges',
            args: [pool]
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully applied pool slope changes');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getWeekData(
    wTime: number,
    pools: Address[],
    { getProvider }: { getProvider: Function }
): Promise<Result<WeekData>> {
    try {
        // Validate all pool addresses
        pools.forEach(validateAddress);

        const provider = getProvider();
        const params = {
            abi: votingControllerAbi,
            functionName: 'getWeekData',
            args: [wTime, pools]
        };

        const result = await provider.readContract(params);
        return {
            success: true,
            data: {
                isEpochFinalized: result.isEpochFinalized,
                totalVotes: result.totalVotes.toString(),
                poolVotes: result.poolVotes.map((vote: bigint) => vote.toString())
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getPoolTotalVoteAt(
    pool: Address,
    wTime: number,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(pool);

        const provider = getProvider();
        const params = {
            abi: votingControllerAbi,
            functionName: 'getPoolTotalVoteAt',
            args: [pool, wTime]
        };

        const result = await provider.readContract(params);
        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function finalizeEpoch(
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        const provider = getProvider();
        const txParams = {
            abi: votingControllerAbi,
            functionName: 'finalizeEpoch',
            args: []
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully finalized epoch');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getBroadcastResultFee(
    chainId: number,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        const provider = getProvider();
        const params = {
            abi: votingControllerAbi,
            functionName: 'getBroadcastResultFee',
            args: [chainId]
        };

        const result = await provider.readContract(params);
        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function broadcastResults(
    chainId: number,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<void>> {
    try {
        const provider = getProvider();
        
        // First get the required fee
        const feeResult = await getBroadcastResultFee(chainId, { getProvider });
        if (!feeResult.success) {
            throw new Error(feeResult.error);
        }

        const txParams = {
            abi: votingControllerAbi,
            functionName: 'broadcastResults',
            args: [chainId],
            value: feeResult.data
        };

        await sendTransactions({ params: txParams });
        await notify('Successfully broadcasted results');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addPool(
    chainId: string,
    pool: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(pool);

        // Prepare transaction
        await notify('Preparing to add pool...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'addPool',
                args: [chainId, pool]
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addMultiPools(
    chainIds: string[],
    pools: Address[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        pools.forEach(validateAddress);

        if (chainIds.length !== pools.length) {
            throw new ValidationError('Array lengths must match');
        }

        // Prepare transaction
        await notify('Preparing to add multiple pools...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'addMultiPools',
                args: [chainIds, pools]
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removePool(
    pool: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(pool);

        // Prepare transaction
        await notify('Preparing to remove pool...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'removePool',
                args: [pool]
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function setPendlePerSec(
    newPendlePerSec: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        // Prepare transaction
        await notify('Preparing to set PENDLE per second...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'setPendlePerSec',
                args: [newPendlePerSec]
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 