import { type Address } from 'viem';
import { type Utils } from '../../types';

export async function cancelBatchOrders(
    orders: any[],
    utils: Utils
): Promise<any> {
    try {
        const { getProvider, sendTransactions, notify } = utils;
        
        if (!sendTransactions) {
            throw new Error('sendTransactions is required but not provided');
        }
        
        // Prepare transaction for canceling batch orders
        const tx = {
            target: orders[0].maker,
            data: '0x',
            value: BigInt(0)
        };

        const result = await sendTransactions({ transactions: [tx] });
        if (notify) {
            await notify('Successfully cancelled batch orders');
        }
        
        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
} 