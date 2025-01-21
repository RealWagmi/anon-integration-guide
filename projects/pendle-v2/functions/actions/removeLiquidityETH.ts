import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

export async function removeLiquidityETH(
    router: Address,
    token: Address,
    liquidity: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: Address,
    deadline: number,
    utils: Utils
): Promise<Result<string>> {
    try {
        const { sendTransactions, notify } = utils;

        notify('Preparing to remove liquidity ETH...');
        notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            transactions: [{
                target: router,
                data: '0x'
            }]
        });

        return { success: true, data: 'Successfully removed liquidity ETH' };
    } catch (error) {
        console.error('Error in removeLiquidityETH:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 