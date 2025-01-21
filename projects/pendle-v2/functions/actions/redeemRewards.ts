import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const pendleGaugeAbi = [
    {
        name: 'redeemRewards',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'user', type: 'address' }
        ],
        outputs: []
    }
];

export async function redeemRewards(
    user: Address,
    gaugeAddress: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        // Validate inputs
        validateAddress(user);
        validateAddress(gaugeAddress);

        // Prepare transaction
        await notify('Preparing to redeem rewards...');
        const tx = {
            target: gaugeAddress,
            data: {
                abi: pendleGaugeAbi,
                functionName: 'redeemRewards',
                args: [user]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully redeemed rewards'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
} 