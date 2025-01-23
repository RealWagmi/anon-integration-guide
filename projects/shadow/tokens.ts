import { NativeCurrency, Token, type Currency } from '@uniswap/sdk-core';
import { zeroAddress } from 'viem';
import { WRAPPED_NATIVE } from './constants.js';

export class NativeToken extends NativeCurrency {
    public address = zeroAddress;

    constructor(chainId: number, symbol?: string, name?: string) {
        super(chainId, 18, symbol, name);
    }

    equals(other: Currency): boolean {
        return other.isNative && other.chainId === this.chainId;
    }

    public get wrapped(): Token {
        return WRAPPED_NATIVE;
    }
}

export type AnyToken = NativeToken | Token;
