import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const feeDistributorAbi = [
    {
        name: 'claimReward',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'pool', type: 'address' },
            { name: 'user', type: 'address' }
        ],
        outputs: []
    },
    {
        name: 'userInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'pool', type: 'address' },
            { name: 'user', type: 'address' }
        ],
        outputs: [
            { name: 'firstUnclaimedWeek', type: 'uint256' },
            { name: 'iter', type: 'uint256' }
        ]
    }
];

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
            error: error instanceof Error ? error : new Error('Unknown error occurred')
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
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
} 