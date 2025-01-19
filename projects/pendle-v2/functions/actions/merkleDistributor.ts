import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { merkleDistributorAbi } from '../../abis';

export async function claim(
    receiver: Address,
    totalAccrued: string,
    proof: string[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);

        // Prepare transaction
        await notify('Preparing to claim rewards...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'claim',
                args: [receiver, totalAccrued, proof]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function claimVerified(
    receiver: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);

        // Prepare transaction
        await notify('Preparing to claim verified rewards...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'claimVerified',
                args: [receiver]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function verify(
    user: Address,
    totalAccrued: string,
    proof: string[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(user);

        // Prepare transaction
        await notify('Preparing to verify merkle proof...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'verify',
                args: [user, totalAccrued, proof]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function setMerkleRoot(
    newMerkleRoot: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        // Prepare transaction
        await notify('Preparing to set new merkle root...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'setMerkleRoot',
                args: [newMerkleRoot]
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

export async function getClaimedAmount(
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'merkleDistributor',
            abi: merkleDistributorAbi,
            functionName: 'claimed',
            args: [user]
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

export async function getVerifiedAmount(
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'merkleDistributor',
            abi: merkleDistributorAbi,
            functionName: 'verified',
            args: [user]
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