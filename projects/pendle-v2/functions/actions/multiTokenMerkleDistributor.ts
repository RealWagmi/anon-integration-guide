import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { multiTokenMerkleDistributorAbi } from '../../abis';

export async function claim(
    receiver: Address,
    tokens: Address[],
    totalAccrueds: string[],
    proofs: string[][],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(receiver);
        tokens.forEach(validateAddress);

        if (tokens.length !== totalAccrueds.length || tokens.length !== proofs.length) {
            throw new ValidationError('Array lengths must match');
        }

        // Prepare transaction
        await notify('Preparing to claim rewards...');
        const tx = {
            target: 'multiTokenMerkleDistributor',
            data: {
                abi: multiTokenMerkleDistributorAbi,
                functionName: 'claim',
                args: [receiver, tokens, totalAccrueds, proofs]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.map((amount: bigint) => amount.toString())
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
    tokens: Address[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(receiver);
        tokens.forEach(validateAddress);

        // Prepare transaction
        await notify('Preparing to claim verified rewards...');
        const tx = {
            target: 'multiTokenMerkleDistributor',
            data: {
                abi: multiTokenMerkleDistributorAbi,
                functionName: 'claimVerified',
                args: [receiver, tokens]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.map((amount: bigint) => amount.toString())
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
    tokens: Address[],
    totalAccrueds: string[],
    proofs: string[][],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(user);
        tokens.forEach(validateAddress);

        if (tokens.length !== totalAccrueds.length || tokens.length !== proofs.length) {
            throw new ValidationError('Array lengths must match');
        }

        // Prepare transaction
        await notify('Preparing to verify merkle proofs...');
        const tx = {
            target: 'multiTokenMerkleDistributor',
            data: {
                abi: multiTokenMerkleDistributorAbi,
                functionName: 'verify',
                args: [user, tokens, totalAccrueds, proofs]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.map((amount: bigint) => amount.toString())
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
            target: 'multiTokenMerkleDistributor',
            data: {
                abi: multiTokenMerkleDistributorAbi,
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
    token: Address,
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(token);
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'multiTokenMerkleDistributor',
            abi: multiTokenMerkleDistributorAbi,
            functionName: 'claimed',
            args: [token, user]
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
    token: Address,
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(token);
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'multiTokenMerkleDistributor',
            abi: multiTokenMerkleDistributorAbi,
            functionName: 'verified',
            args: [token, user]
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