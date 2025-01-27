import { describe, expect, it, vi } from 'vitest';
import { parseAmount, parseRange, parseRegister, parseWallet } from './utils';

vi.mock('@heyanon/sdk');

type UtilsParams<T extends (...args: any) => any> = Parameters<T>[0] & { expected: ReturnType<T> };

describe('utils', () => {
    it.each`
        account                                         | chainName             | expected
        ${''}                                           | ${'Avalanche'}        | ${{ success: false, errorMessage: 'Wallet not connected' }}
        ${'not-an-address'}                             | ${'Avalanche'}        | ${{ success: false, errorMessage: 'Expected account to be a valid address' }}
        ${'0x1234567890123456789012345678901234567890'} | ${'UnsupportedChain'} | ${{ success: false, errorMessage: 'Unsupported chain name: UnsupportedChain' }}
        ${'0x1234567890123456789012345678901234567890'} | ${'Ethereum'}         | ${{ success: false, errorMessage: 'Protocol is not supported on Ethereum' }}
        ${'0x1234567890123456789012345678901234567890'} | ${'Avalanche'}        | ${{ success: true, data: { account: '0x1234567890123456789012345678901234567890', chainId: 43114 } }}
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
        from  | to    | expected
        ${''} | ${''} | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${''} | ${2}  | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${0}  | ${''} | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${0}  | ${0}  | ${{ success: false, errorMessage: 'Expected from to be less than to' }}
        ${1}  | ${0}  | ${{ success: false, errorMessage: 'Expected from to be less than to' }}
        ${1}  | ${10} | ${{ success: true, data: { from: 1n, to: 10n } }}
    `('should return $expected when from is $from and to is $to', ({ from, to, expected }: UtilsParams<typeof parseRange>) => {
        const result = parseRange({ from, to });

        expect(result).toEqual(expected);
    });

    const blsProofOfPossession =
        '0xb669f548233c42cceee50cff97a9a112a7e1759a6aa2b6af4a2d73fd79becd3999c86fd188dfa800436c79a1b86a3c77906522b03ddce477bfe913446da6b193314830935042100f814659b803b0678c70273ecdae63c94d94dee2c4ece175b4022e50640b514b301cbb82b31b152c1d2bf1db405b8ca94ca4f3ba6ec6c5da9d0cf45944637025373e983168384a6cee';

    it.each`
        blsProofOfPossession    | nodeId        | validationDuration | expected
        ${undefined}            | ${'NodeID-1'} | ${'TWO_WEEKS'}     | ${{ success: false, errorMessage: 'Invalid BLS Proof of Possession' }}
        ${''}                   | ${'NodeID-1'} | ${'TWO_WEEKS'}     | ${{ success: false, errorMessage: 'Invalid BLS Proof of Possession' }}
        ${blsProofOfPossession} | ${undefined}  | ${'TWO_WEEKS'}     | ${{ success: false, errorMessage: 'Invalid node id' }}
        ${blsProofOfPossession} | ${''}         | ${'TWO_WEEKS'}     | ${{ success: false, errorMessage: 'Invalid node id' }}
        ${blsProofOfPossession} | ${'NodeID-1'} | ${undefined}       | ${{ success: false, errorMessage: 'Invalid validation duration' }}
        ${blsProofOfPossession} | ${'NodeID-1'} | ${''}              | ${{ success: false, errorMessage: 'Invalid validation duration' }}
        ${blsProofOfPossession} | ${'NodeID-1'} | ${'TWO_WEEKS'}     | ${{ success: true, data: { blsProofOfPossession, nodeId: 'NodeID-1', validationDuration: 'TWO_WEEKS' } }}
    `('should validate parseRegister and return $expected', ({ blsProofOfPossession, nodeId, validationDuration, expected }: UtilsParams<typeof parseRegister>) => {
        const result = parseRegister({ blsProofOfPossession, nodeId, validationDuration });

        expect(result).toEqual(expected);
    });
});
