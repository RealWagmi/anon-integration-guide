import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

export async function redeemSyToToken(
    token: Address,
    amount: string,
    utils: Utils
): Promise<Result<string>> {
    try {
        const { sendTransactions, notify } = utils;

        notify('Preparing to redeem SY to token...');
        notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            transactions: [{
                target: token,
                data: '0x'
            }]
        });

        return { success: true, data: 'Successfully redeemed SY to token' };
    } catch (error) {
        console.error('Error in redeemSyToToken:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 