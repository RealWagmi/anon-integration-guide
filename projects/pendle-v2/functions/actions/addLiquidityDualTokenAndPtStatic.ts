import { type Address } from 'viem';
import { type Result } from '../../types';
import { type Utils } from '../../utils/types';

interface AddLiquidityDualTokenAndPtStaticResult {
    netLpOut: bigint;
    netTokenFee: bigint;
    netPtFee: bigint;
}

export async function addLiquidityDualTokenAndPtStatic(
    market: Address,
    token: Address,
    tokenAmount: string,
    ptAmount: string,
    utils: Utils
): Promise<Result<AddLiquidityDualTokenAndPtStaticResult>> {
    try {
        const { getProvider } = utils;
        const provider = getProvider();

        const result = await provider.readContract({
            functionName: 'addLiquidityDualTokenAndPtStatic',
            args: [market, token, tokenAmount, ptAmount]
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in addLiquidityDualTokenAndPtStatic:', error);
        return { success: false, error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
} 