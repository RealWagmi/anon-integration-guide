import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

export async function initialize(
    router: Address,
    utils: Utils
): Promise<Result<string>> {
    try {
        const { sendTransactions, notify } = utils;

        notify('Preparing to initialize router...');
        notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            transactions: [{
                target: router,
                data: '0x'
            }]
        });

        return { success: true, data: 'Successfully initialized router' };
    } catch (error) {
        console.error('Error in initialize:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 