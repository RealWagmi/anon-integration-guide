import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

interface AddLiquiditySingleSyKeepYtStaticResult {
    netLpOut: bigint;
    netSyFee: bigint;
}

export async function addLiquiditySingleSyKeepYtStatic(
    market: Address,
    syAmount: string,
    utils: Utils
): Promise<Result<AddLiquiditySingleSyKeepYtStaticResult>> {
    try {
        const { getProvider } = utils;
        const provider = getProvider();

        const result = await provider.readContract({
            functionName: 'addLiquiditySingleSyKeepYtStatic',
            args: [market, syAmount]
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in addLiquiditySingleSyKeepYtStatic:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 