import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { feeDistributorAbi } from '../../abis';

export async function claimReward(
    pool: Address,
    user: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(pool);
        validateAddress(user);

        // Prepare transaction
        await notify('Preparing to claim rewards...');
        const tx = {
            target: 'feeDistributor',
            data: {
                abi: feeDistributorAbi,
                functionName: 'claimReward',
                args: [pool, user]
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
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getUserInfo(
    pool: Address,
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    firstUnclaimedWeek: string;
    iter: string;
}>> {
    try {
        validateAddress(pool);
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'feeDistributor',
            abi: feeDistributorAbi,
            functionName: 'userInfo',
            args: [pool, user]
        });

        return {
            success: true,
            data: {
                firstUnclaimedWeek: result.firstUnclaimedWeek.toString(),
                iter: result.iter.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 