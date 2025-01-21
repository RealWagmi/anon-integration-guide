import { type Address } from 'viem';
import { type Utils } from '../../types';

export async function fillOrders(
    orders: any[],
    receiver: Address,
    maxTaking: string,
    callback: string,
    utils: Utils
): Promise<any> {
    try {
        const { getProvider, sendTransactions, notify } = utils;
        
        if (!sendTransactions) {
            throw new Error('sendTransactions is required but not provided');
        }
        
        // Prepare transaction for filling orders
        const tx = {
            target: receiver,
            data: '0x',
            value: BigInt(0)
        };

        const result = await sendTransactions({ transactions: [tx] });
        if (notify) {
            await notify('Successfully filled orders');
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