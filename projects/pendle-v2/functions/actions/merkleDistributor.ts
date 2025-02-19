import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const merkleDistributorAbi = [
    {
        name: 'claim',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'merkleProof', type: 'bytes32[]' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'claimVerified',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'merkleProof', type: 'bytes32[]' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    }
];

export interface ClaimParams {
    chainName: string;
    account: Address;
    merkleProof: string[];
    amount: bigint;
}

export async function claim(
    params: ClaimParams,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        validateAddress(params.account);

        // Prepare transaction
        await notify('Preparing to claim rewards...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'claim',
                args: [params.account, params.merkleProof, params.amount]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully claimed rewards'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function claimVerified(
    params: ClaimParams,
    utils: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        validateAddress(params.account);

        // Prepare transaction
        await utils.notify('Preparing to claim verified rewards...');
        const tx = {
            target: 'merkleDistributor',
            data: {
                abi: merkleDistributorAbi,
                functionName: 'claimVerified',
                args: [params.account, params.merkleProof, params.amount]
            }
        };

        await utils.notify('Waiting for transaction confirmation...');
        const result = await utils.sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully claimed verified rewards'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
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