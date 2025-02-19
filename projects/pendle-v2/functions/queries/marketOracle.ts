import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const marketAbi = [
    {
        name: 'observations',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'index', type: 'uint256' }
        ],
        outputs: [
            { name: 'blockTimestamp', type: 'uint256' },
            { name: 'lnImpliedRateCumulative', type: 'uint256' },
            { name: 'initialized', type: 'bool' }
        ]
    }
];

export interface Observation {
    blockTimestamp: number;
    lnImpliedRateCumulative: string;
    initialized: boolean;
}

export async function observe(
    market: Address,
    secondsAgos: number[],
    { getProvider }: { getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: marketAbi,
            functionName: 'observe',
            args: [secondsAgos]
        });

        return {
            success: true,
            data: result.map((rate: bigint) => rate.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getOracleState(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<{
    lastLnImpliedRate: string;
    observationIndex: number;
    observationCardinality: number;
    observationCardinalityNext: number;
}>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: marketAbi,
            functionName: '_storage',
            args: []
        });

        return {
            success: true,
            data: {
                lastLnImpliedRate: result.lastLnImpliedRate.toString(),
                observationIndex: result.observationIndex,
                observationCardinality: result.observationCardinality,
                observationCardinalityNext: result.observationCardinalityNext
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getObservation(
    market: Address,
    index: number,
    { getProvider }: { getProvider: Function }
): Promise<Result<Observation>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: marketAbi,
            functionName: 'observations',
            args: [index]
        });

        return {
            success: true,
            data: {
                blockTimestamp: Number(result.blockTimestamp),
                lnImpliedRateCumulative: result.lnImpliedRateCumulative.toString(),
                initialized: result.initialized
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 