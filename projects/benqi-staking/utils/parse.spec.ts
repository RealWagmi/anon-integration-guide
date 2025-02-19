import { describe, expect, it, vi } from 'vitest';
import { parseAmount, parseNodes, parseNodesWithWeights, parseRange, parseWallet } from './parse';

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
        nodeIds                     | expected
        ${''}                       | ${{ success: false, errorMessage: 'Expected nodeIds to be an array' }}
        ${[]}                       | ${{ success: false, errorMessage: 'Expected at least one node id' }}
        ${['NodeId-1']}             | ${{ success: true, data: { nodeIds: ['NodeId-1'] } }}
        ${['NodeId-1', 'NodeId-2']} | ${{ success: true, data: { nodeIds: ['NodeId-1', 'NodeId-2'] } }}
    `('should return $expected when node IDs is $nodeIds', ({ nodeIds, expected }: UtilsParams<typeof parseNodes>) => {
        const result = parseNodes({ nodeIds });

        expect(result).toEqual(expected);
    });

    it.each`
        nodeIds                     | weights         | expected
        ${''}                       | ${''}           | ${{ success: false, errorMessage: 'Expected nodeIds to be an array' }}
        ${[]}                       | ${''}           | ${{ success: false, errorMessage: 'Expected at least one node id' }}
        ${['NodeId-1']}             | ${''}           | ${{ success: false, errorMessage: 'Expected weights to be an array' }}
        ${['NodeId-1']}             | ${[]}           | ${{ success: false, errorMessage: 'Expected at least one weight' }}
        ${['NodeId-1', 'NodeId-2']} | ${['10']}       | ${{ success: false, errorMessage: 'Expected nodeIds and weights to be the same length' }}
        ${['NodeId-1']}             | ${['10']}       | ${{ success: true, data: { nodeIds: ['NodeId-1'], weights: [1000n] } }}
        ${['NodeId-1', 'NodeId-2']} | ${['10', '90']} | ${{ success: true, data: { nodeIds: ['NodeId-1', 'NodeId-2'], weights: [1000n, 9000n] } }}
        ${['NodeId-1', 'NodeId-2']} | ${['50', '60']} | ${{ success: false, errorMessage: 'Sum of weights must be less than or equal to 100' }}
    `('should return $expected when node IDs is $nodeIds and weights is $weights', ({ nodeIds, weights, expected }) => {
        const result = parseNodesWithWeights({ nodeIds, weights });

        expect(result).toEqual(expected);
    });

    it.each`
        from   | to     | expected
        ${''}  | ${''}  | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${''}  | ${2}   | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${0}   | ${''}  | ${{ success: false, errorMessage: 'Expected from and to to be numbers' }}
        ${0.1} | ${1}   | ${{ success: false, errorMessage: 'Expected from and to to be integers' }}
        ${0}   | ${1.5} | ${{ success: false, errorMessage: 'Expected from and to to be integers' }}
        ${0}   | ${0}   | ${{ success: false, errorMessage: 'Expected from to be less than to' }}
        ${1}   | ${0}   | ${{ success: false, errorMessage: 'Expected from to be less than to' }}
        ${1}   | ${10}  | ${{ success: true, data: { from: 1n, to: 10n } }}
    `('should return $expected when from is $from and to is $to', ({ from, to, expected }) => {
        const result = parseRange({ from, to });

        expect(result).toEqual(expected);
    });
});
