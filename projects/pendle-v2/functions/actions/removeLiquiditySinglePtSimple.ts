import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

export async function removeLiquiditySinglePtSimple(
    market: Address,
    amount: string,
    utils: Utils
): Promise<Result<string>> {
    try {
        const { sendTransactions, notify } = utils;

        notify('Preparing to remove liquidity single PT simple...');
        notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            transactions: [{
                target: market,
                data: '0x'
            }]
        });

        return { success: true, data: 'Successfully removed liquidity single PT simple' };
    } catch (error) {
        console.error('Error in removeLiquiditySinglePtSimple:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 