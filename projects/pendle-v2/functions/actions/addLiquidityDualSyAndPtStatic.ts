import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

interface AddLiquidityDualSyAndPtStaticResult {
    netLpOut: bigint;
    netSyFee: bigint;
    netPtFee: bigint;
}

export async function addLiquidityDualSyAndPtStatic(
    market: Address,
    syAmount: string,
    ptAmount: string,
    utils: Utils
): Promise<Result<AddLiquidityDualSyAndPtStaticResult>> {
    try {
        const { getProvider } = utils;
        const provider = getProvider();

        const result = await provider.readContract({
            functionName: 'addLiquidityDualSyAndPtStatic',
            args: [market, syAmount, ptAmount]
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in addLiquidityDualSyAndPtStatic:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 