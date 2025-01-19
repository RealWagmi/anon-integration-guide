import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionMarketAuxAbi = require('../../abis/IPActionMarketAuxStatic.json').abi;

interface MarketState {
    totalPt: string;
    totalSy: string;
    totalLp: string;
    treasury: string;
    scalarRoot: string;
    expiry: string;
}

export async function calcPriceImpactPY(
    market: Address,
    netPtOut: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'calcPriceImpactPY',
            args: [market, netPtOut]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function calcPriceImpactPt(
    market: Address,
    netPtOut: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'calcPriceImpactPt',
            args: [market, netPtOut]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function calcPriceImpactYt(
    market: Address,
    netPtOut: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'calcPriceImpactYt',
            args: [market, netPtOut]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getMarketState(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    pt: Address;
    yt: Address;
    sy: Address;
    impliedYield: string;
    marketExchangeRateExcludeFee: string;
    state: MarketState;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getMarketState',
            args: [market]
        });

        return {
            success: true,
            data: {
                pt: result[0],
                yt: result[1],
                sy: result[2],
                impliedYield: result[3].toString(),
                marketExchangeRateExcludeFee: result[4].toString(),
                state: {
                    totalPt: result[5].totalPt.toString(),
                    totalSy: result[5].totalSy.toString(),
                    totalLp: result[5].totalLp.toString(),
                    treasury: result[5].treasury.toString(),
                    scalarRoot: result[5].scalarRoot.toString(),
                    expiry: result[5].expiry.toString()
                }
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getTradeExchangeRateExcludeFee(
    market: Address,
    state: MarketState,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getTradeExchangeRateExcludeFee',
            args: [market, state]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getTradeExchangeRateIncludeFee(
    market: Address,
    netPtOut: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getTradeExchangeRateIncludeFee',
            args: [market, netPtOut]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getYieldTokenAndPtRate(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    yieldToken: Address;
    netPtOut: string;
    netYieldTokenOut: string;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getYieldTokenAndPtRate',
            args: [market]
        });

        return {
            success: true,
            data: {
                yieldToken: result[0],
                netPtOut: result[1].toString(),
                netYieldTokenOut: result[2].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getYieldTokenAndYtRate(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    yieldToken: Address;
    netYtOut: string;
    netYieldTokenOut: string;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getYieldTokenAndYtRate',
            args: [market]
        });

        return {
            success: true,
            data: {
                yieldToken: result[0],
                netYtOut: result[1].toString(),
                netYieldTokenOut: result[2].toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getLpToSyRate(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMarketAuxAbi,
            functionName: 'getLpToSyRate',
            args: [market]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 