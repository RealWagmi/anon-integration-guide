import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionMarketCoreAbi = require('../../abis/IPActionMarketCoreStatic.json').abi;

export async function addLiquidityDualSyAndPtStatic(
    market: Address,
    netSyDesired: string,
    netPtDesired: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    netLpOut: string;
    netSyUsed: string;
    netPtUsed: string;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketCoreAbi,
            functionName: 'addLiquidityDualSyAndPtStatic',
            args: [market, netSyDesired, netPtDesired]
        });

        return {
            success: true,
            data: {
                netLpOut: result[0].toString(),
                netSyUsed: result[1].toString(),
                netPtUsed: result[2].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquidityDualTokenAndPtStatic(
    market: Address,
    tokenIn: Address,
    netTokenDesired: string,
    netPtDesired: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    netLpOut: string;
    netTokenUsed: string;
    netPtUsed: string;
    netSyUsed: string;
    netSyDesired: string;
}>> {
    try {
        validateAddress(market);
        validateAddress(tokenIn);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketCoreAbi,
            functionName: 'addLiquidityDualTokenAndPtStatic',
            args: [market, tokenIn, netTokenDesired, netPtDesired]
        });

        return {
            success: true,
            data: {
                netLpOut: result[0].toString(),
                netTokenUsed: result[1].toString(),
                netPtUsed: result[2].toString(),
                netSyUsed: result[3].toString(),
                netSyDesired: result[4].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySinglePtStatic(
    market: Address,
    netPtIn: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    netLpOut: string;
    netPtToSwap: string;
    netSyFee: string;
    priceImpact: string;
    exchangeRateAfter: string;
    netSyFromSwap: string;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketCoreAbi,
            functionName: 'addLiquiditySinglePtStatic',
            args: [market, netPtIn]
        });

        return {
            success: true,
            data: {
                netLpOut: result[0].toString(),
                netPtToSwap: result[1].toString(),
                netSyFee: result[2].toString(),
                priceImpact: result[3].toString(),
                exchangeRateAfter: result[4].toString(),
                netSyFromSwap: result[5].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySingleSyKeepYtStatic(
    market: Address,
    netSyIn: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    netLpOut: string;
    netSyFee: string;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketCoreAbi,
            functionName: 'addLiquiditySingleSyKeepYtStatic',
            args: [market, netSyIn]
        });

        return {
            success: true,
            data: {
                netLpOut: result[0].toString(),
                netSyFee: result[1].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 