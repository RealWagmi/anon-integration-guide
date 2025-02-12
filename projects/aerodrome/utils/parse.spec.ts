import { describe, expect, it, vi } from 'vitest';
import { parseAmount, parseTokensAndFees, parseWallet } from './parse';

vi.mock('@heyanon/sdk');

type UtilsParams<T extends (...args: any) => any> = Parameters<T>[0] & { expected: ReturnType<T> };

const testAddress = ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'] as const;

describe('utils', () => {
    it.each`
        account             | chainName             | expected
        ${''}               | ${'Base'}             | ${{ success: false, errorMessage: 'Wallet not connected' }}
        ${'not-an-address'} | ${'Base'}             | ${{ success: false, errorMessage: 'Expected account to be a valid address' }}
        ${testAddress[0]}   | ${'UnsupportedChain'} | ${{ success: false, errorMessage: 'Unsupported chain name: UnsupportedChain' }}
        ${testAddress[0]}   | ${'Ethereum'}         | ${{ success: false, errorMessage: 'Protocol is not supported on Ethereum' }}
        ${testAddress[0]}   | ${'Base'}             | ${{ success: true, data: { account: testAddress[0], chainId: 8453 } }}
    `('should return $expected when account is $account and chainName is $chainName', ({ account, chainName, expected }: UtilsParams<typeof parseWallet>) => {
        const result = parseWallet({ account, chainName });

        expect(result).toEqual(expected);
    });

    it.each`
        amount   | decimals | expected
        ${''}    | ${0}     | ${{ success: false, errorMessage: 'Amount must be a string' }}
        ${'0'}   | ${0}     | ${{ success: false, errorMessage: 'Amount must be greater than 0' }}
        ${'1'}   | ${0}     | ${{ success: true, data: BigInt(1) }}
        ${'0.1'} | ${2}     | ${{ success: true, data: BigInt(10) }}
        ${'1.1'} | ${18}    | ${{ success: true, data: BigInt(1_100) * 10n ** BigInt(15) }}
    `('should return $expected when amount is $amount and decimals is $decimals', ({ amount, decimals, expected }: UtilsParams<typeof parseAmount>) => {
        const result = parseAmount({ amount, decimals });

        expect(result).toEqual(expected);
    });

    it.each`
        tokens                                              | fees                 | expected
        ${null}                                             | ${[]}                | ${{ success: false, errorMessage: 'Expected tokens to be an array' }}
        ${[testAddress[0]]}                                 | ${null}              | ${{ success: false, errorMessage: 'Expected fees to be an array' }}
        ${[testAddress[0]]}                                 | ${['LOW']}           | ${{ success: false, errorMessage: 'Expected at least two tokens' }}
        ${[testAddress[0], testAddress[1]]}                 | ${[]}                | ${{ success: false, errorMessage: 'Expected at least one fee' }}
        ${[testAddress[0], testAddress[1], testAddress[2]]} | ${['LOW']}           | ${{ success: false, errorMessage: 'Incorrect amount of fees in relation to tokens' }}
        ${[testAddress[0], testAddress[1], testAddress[2]]} | ${['LOW', 'MEDIUM']} | ${{ success: true, data: { tokens: [testAddress[0], testAddress[1], testAddress[2]], fees: ['LOW', 'MEDIUM'] } }}
    `('should return $expected when tokens are $tokens and fees are $fees', ({ tokens, fees, expected }: UtilsParams<typeof parseTokensAndFees>) => {
        const result = parseTokensAndFees({ tokens, fees });

        expect(result).toEqual(expected);
    });
});
