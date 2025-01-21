import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

interface AddLiquiditySinglePtStaticResult {
    netLpOut: bigint;
    netPtFee: bigint;
}

export async function addLiquiditySinglePtStatic(
    market: Address,
    ptAmount: string,
    utils: Utils
): Promise<Result<AddLiquiditySinglePtStaticResult>> {
    try {
        const { getProvider } = utils;
        const provider = getProvider();

        const result = await provider.readContract({
            functionName: 'addLiquiditySinglePtStatic',
            args: [market, ptAmount]
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in addLiquiditySinglePtStatic:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 