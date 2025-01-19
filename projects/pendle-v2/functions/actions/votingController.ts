import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { votingControllerAbi } from '../../abis';

export async function vote(
    pools: Address[],
    weights: string[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        pools.forEach(validateAddress);

        if (pools.length !== weights.length) {
            throw new ValidationError('Array lengths must match');
        }

        // Prepare transaction
        await notify('Preparing to vote...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'vote',
                args: [pools, weights]
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

export async function applyPoolSlopeChanges(
    pool: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(pool);

        // Prepare transaction
        await notify('Preparing to apply pool slope changes...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'applyPoolSlopeChanges',
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

export async function finalizeEpoch(
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        // Prepare transaction
        await notify('Preparing to finalize epoch...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'finalizeEpoch',
                args: []
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

export async function broadcastResults(
    chainId: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        // Prepare transaction
        await notify('Preparing to broadcast results...');
        const tx = {
            target: 'votingController',
            data: {
                abi: votingControllerAbi,
                functionName: 'broadcastResults',
                args: [chainId]
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

export async function getBroadcastResultFee(
    chainId: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            address: 'votingController',
            abi: votingControllerAbi,
            functionName: 'getBroadcastResultFee',
            args: [chainId]
        });

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