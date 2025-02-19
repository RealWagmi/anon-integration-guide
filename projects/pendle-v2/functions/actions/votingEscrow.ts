import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { votingEscrowAbi } from '../../abis';

export async function lock(
    amount: string,
    lockDuration: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        // Prepare transaction
        await notify('Preparing to lock PENDLE tokens...');
        const tx = {
            target: 'votingEscrow',
            data: {
                abi: votingEscrowAbi,
                functionName: 'lock',
                args: [amount, lockDuration]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully locked PENDLE tokens'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getLockedBalance(
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    amount: string;
    end: string;
}>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'votingEscrow',
            abi: votingEscrowAbi,
            functionName: 'lockedBalance',
            args: [user]
        });

        return {
            success: true,
            data: {
                amount: result.amount.toString(),
                end: result.end.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 