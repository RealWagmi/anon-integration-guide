import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { pendleGaugeAbi } from '../../abis';

export async function redeemExternalReward(
    gaugeAddress: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        // Validate inputs
        validateAddress(gaugeAddress);

        // Prepare transaction
        await notify('Preparing to redeem external rewards...');
        const tx = {
            target: gaugeAddress,
            data: {
                abi: pendleGaugeAbi,
                functionName: 'redeemExternalReward',
                args: []
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully redeemed external rewards'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 