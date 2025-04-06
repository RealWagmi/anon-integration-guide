import { WAD } from '../constants';

/**
 * Multiply a token amount in wei by a floating point number
 */
export function multiplyTokenAmount(amountInWei: bigint, multiplier: number): bigint {
    return (amountInWei * BigInt(Number(WAD) * multiplier)) / WAD;
}

/**
 * Get the fraction of a token that the user holds.
 */
export function getTokenFraction(amountInWei: bigint, totalSupplyInWei: bigint): number {
    return Number((WAD * amountInWei) / totalSupplyInWei) / Number(WAD);
}
