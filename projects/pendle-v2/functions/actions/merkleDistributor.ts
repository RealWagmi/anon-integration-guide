import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { merkleDistributorAbi } from '../../abis';

export interface ClaimParams {
    chainName: string;
    account: Address;
    merkleProof: string[];
    amount: bigint;
}

export async function claim(
    params: ClaimParams,
    utils: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<void>> {
    const { account } = params;
    if (!validateAddress(account)) {
        return { success: false, error: new Error('Invalid account address') };
    }

    try {
        await utils.sendTransactions({
            to: account,
            data: '0x', // Replace with actual contract call data
        });
        await utils.notify('Claim successful');
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: error as Error };
    }
}

export async function claimVerified(
    params: ClaimParams,
    utils: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<void>> {
    const verifyResult = await verify(params, { getProvider: utils.getProvider });
    if (!verifyResult.success) {
        return verifyResult;
    }

    return claim(params, utils);
}

export async function verify(
    params: ClaimParams,
    utils: { getProvider: any }
): Promise<Result<boolean>> {
    const { account } = params;
    if (!validateAddress(account)) {
        return { success: false, error: new Error('Invalid account address') };
    }

    try {
        // Implement merkle proof verification logic here
        return { success: true, data: true };
    } catch (error) {
        return { success: false, error: error as Error };
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