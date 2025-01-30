import { Buffer } from 'buffer';
import * as BufferLayout from '@solana/buffer-layout';
import { BN } from 'bn.js';

export interface DecodedAssets {
    feesReserves: bigint;
    owned: bigint;
    locked: bigint;
    guaranteedUsd: bigint;
    globalShortSizes: bigint;
    globalShortAveragePrices: bigint;
}

export interface DecodedFundingRateState {
    cumulativeInterestRate: bigint;
    lastUpdated: bigint;
    hourlyFundingDbps: bigint;
}

export interface DecodedJumpRateState {
    minRateBps: bigint;
    maxRateBps: bigint;
    targetRateBps: bigint;
    targetUtilizationRate: bigint;
}

export interface DecodedCustody {
    pool: number[];
    mint: number[];
    tokenAccount: number[];
    decimals: number;
    isStable: boolean;
    assets: DecodedAssets;
    fundingRateState: DecodedFundingRateState;
    jumpRateState: DecodedJumpRateState;
}

class Uint64Layout extends BufferLayout.Layout<bigint> {
    constructor(property?: string) {
        super(8, property);
    }

    decode(b: Uint8Array, offset = 0): bigint {
        const bn = new BN(b.slice(offset, offset + 8), 'le');
        return BigInt(bn.toString());
    }

    encode(src: bigint, b: Uint8Array, offset = 0): number {
        const bn = new BN(src.toString());
        const slice = b.slice(offset, offset + 8);
        bn.toArrayLike(Buffer, 'le', 8).copy(Buffer.from(slice));
        return 8;
    }
}

class BoolLayout extends BufferLayout.Layout<boolean> {
    constructor(property?: string) {
        super(1, property);
    }

    decode(b: Uint8Array, offset = 0): boolean {
        return !!b[offset];
    }

    encode(src: boolean, b: Uint8Array, offset = 0): number {
        b[offset] = +src;
        return 1;
    }
}

const u64 = (property?: string) => new Uint64Layout(property);
const bool = (property?: string) => new BoolLayout(property);

export const AssetsLayout: BufferLayout.Structure<DecodedAssets> = BufferLayout.struct([
    u64('feesReserves'),
    u64('owned'),
    u64('locked'),
    u64('guaranteedUsd'),
    u64('globalShortSizes'),
    u64('globalShortAveragePrices')
]);

export const FundingRateStateLayout: BufferLayout.Structure<DecodedFundingRateState> = BufferLayout.struct([
    u64('cumulativeInterestRate'),
    u64('lastUpdated'),
    u64('hourlyFundingDbps')
]);

export const JumpRateStateLayout: BufferLayout.Structure<DecodedJumpRateState> = BufferLayout.struct([
    u64('minRateBps'),
    u64('maxRateBps'),
    u64('targetRateBps'),
    u64('targetUtilizationRate')
]);

export const CustodyLayout: BufferLayout.Structure<DecodedCustody> = BufferLayout.struct([
    BufferLayout.seq(BufferLayout.u8(), 32, 'pool'),
    BufferLayout.seq(BufferLayout.u8(), 32, 'mint'),
    BufferLayout.seq(BufferLayout.u8(), 32, 'tokenAccount'),
    BufferLayout.u8('decimals'),
    bool('isStable'),
    AssetsLayout.replicate('assets'),
    FundingRateStateLayout.replicate('fundingRateState'),
    JumpRateStateLayout.replicate('jumpRateState')
]);

/**
 * Deserialize custody account data
 */
export function deserializeCustody(data: Buffer): DecodedCustody {
    return CustodyLayout.decode(data);
}
