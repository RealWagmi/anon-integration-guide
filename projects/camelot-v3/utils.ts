import { Address, erc20Abi, formatUnits, parseUnits, PublicClient } from 'viem';
import { MAX_TICK, MIN_TICK } from './constants';

export async function getDecimals(provider: PublicClient, token: Address): Promise<number> {
    // Try-catch to detect invalid token address
    try {
        return provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'decimals',
            args: [],
        });
    } catch (error) {
        throw new Error(`Failed to get decimals for token ${token}`);
    }
}

export async function amountToWei(provider: PublicClient, token: Address, amount: string | undefined): Promise<bigint> {
    if (!amount) return 0n;

    const decimals = await getDecimals(provider, token);
    return parseUnits(amount, decimals);
}

export async function weiToAmount(provider: PublicClient, token: Address, amountInWei: bigint): Promise<string> {
    const decimals = await getDecimals(provider, token);
    return formatUnits(amountInWei, decimals);
}

export function parseAmountOutFromQuote(data: string, tokenOutDecimals: number): bigint {
    const regex = /Expecting to receive (\d+\.\d+) /;
    const match = data.match(regex);

    if (match) {
        return parseUnits(match[1], tokenOutDecimals);
    } else {
        throw new Error('Failed to parse amountOut from quote');
    }
}

export function parseAmountInFromQuote(data: string, tokenInDecimals: number): bigint {
    const regex = /Expecting to pay (\d+\.\d+) /;
    const match = data.match(regex);

    if (match) {
        return parseUnits(match[1], tokenInDecimals);
    } else {
        throw new Error('Failed to parse amountIn from quote');
    }
}

// REFERENCE: https://support.uniswap.org/hc/en-us/articles/21068898875661-How-to-convert-a-price-to-a-tick-that-can-be-initialized
export function convertPriceToTick(price: bigint, tokenBDecimals: number, tickSpacing: number, isLower: boolean): number {
    const basePrice = parseUnits('1', tokenBDecimals);
    const sqrtPrice = Number(price) / Number(basePrice);
    const tick = Math.floor(Math.log(sqrtPrice) / Math.log(1.0001));

    if (isLower) {
        const adjustedTick = Math.floor(tick / tickSpacing) * tickSpacing;
        if (adjustedTick < MIN_TICK) {
            return MIN_TICK;
        }

        return adjustedTick;
    }

    const adjustedTick = Math.ceil(tick / tickSpacing) * tickSpacing;
    if (adjustedTick > MAX_TICK) {
        return MAX_TICK;
    }

    return adjustedTick;
}

export function convertTickToPrice(tick: number, token0Decimals: number, token1Decimals: number): number {
    const price = Math.pow(1.0001, tick);
    const diff = token0Decimals - token1Decimals;
    return price * Math.pow(10, diff);
}
