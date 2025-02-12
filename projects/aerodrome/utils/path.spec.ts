import { Buffer } from 'node:buffer';
import { Address, getAddress } from 'viem';
import { FEE_SIZE, FeeAmount, feeAmounts } from '../constants';
import { describe, it, expect } from 'vitest';
import { encodePath } from './path';

const ADDR_SIZE = 20;
const OFFSET = ADDR_SIZE + FEE_SIZE;
const DATA_SIZE = OFFSET + ADDR_SIZE;

function decodeOne(tokenFeeToken: Buffer): [[string, string], number] {
    // reads the first 20 bytes for the token address
    const tokenABuf = tokenFeeToken.subarray(0, ADDR_SIZE);
    const tokenA = getAddress('0x' + tokenABuf.toString('hex'));

    // reads the next 2 bytes for the fee
    const feeBuf = tokenFeeToken.subarray(ADDR_SIZE, OFFSET);
    const fee = feeBuf.readUIntBE(0, FEE_SIZE);

    // reads the next 20 bytes for the token address
    const tokenBBuf = tokenFeeToken.subarray(OFFSET, DATA_SIZE);
    const tokenB = getAddress('0x' + tokenBBuf.toString('hex'));

    return [[tokenA, tokenB], fee];
}

function decodePath(path: string): [string[], number[]] {
    let data = Buffer.from(path.slice(2), 'hex');

    let tokens: string[] = [];
    let fees: number[] = [];
    let i = 0;
    let finalToken: string = '';
    while (data.length >= DATA_SIZE) {
        const [[tokenA, tokenB], fee] = decodeOne(data);
        finalToken = tokenB;
        tokens = [...tokens, tokenA];
        fees = [...fees, fee];
        data = data.subarray((i + 1) * OFFSET);
        i += 1;
    }
    tokens = [...tokens, finalToken];

    return [tokens, fees];
}

describe('encodePath', () => {
    it("should throw error if fees count doesn't match address count", () => {
        const tokens: Address[] = ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'];
        const fees: FeeAmount[] = ['V3_MEDIUM'];

        expect(() => encodePath(tokens, fees)).toThrow();
    });

    it('should encode a path with fees', () => {
        const tokensIn: Address[] = ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'];
        const feesIn: FeeAmount[] = ['V3_MEDIUM', 'V3_HIGH'];

        const path = encodePath(tokensIn, feesIn);
        console.log(path);
        const [tokensOut, feesOut] = decodePath(path);

        expect(tokensIn).toEqual(tokensOut);
        expect(feesIn.map((fee) => feeAmounts[fee])).toEqual(feesOut);
    });
});
