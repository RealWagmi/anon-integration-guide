import { describe, expect, it, vi } from 'vitest';
import { CORE_MARKETS, ECOSYSTEM_MARKETS } from './constants';
import { parseAmount, parseMarket, parseMarketList, parseWallet } from './utils';

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
        marketName   | marketType     | expected
        ${''}        | ${'core'}      | ${{ success: false, errorMessage: 'Incorrect market name specified' }}
        ${'unknown'} | ${'core'}      | ${{ success: false, errorMessage: 'Incorrect market specified' }}
        ${'unknown'} | ${'ecosystem'} | ${{ success: false, errorMessage: 'Incorrect market specified' }}
        ${'USDC'}    | ${'core'}      | ${{ success: true, data: { marketType: 'core', marketName: 'USDC', marketAddress: CORE_MARKETS.USDC } }}
        ${'USDC'}    | ${'ecosystem'} | ${{ success: true, data: { marketType: 'ecosystem', marketName: 'USDC', marketAddress: ECOSYSTEM_MARKETS.USDC } }}
    `('should return $expected when marketName is $marketName and marketType is $marketType', ({ marketName, marketType, expected }: UtilsParams<typeof parseMarket>) => {
        const result = parseMarket({ marketName, marketType } as Parameters<typeof parseMarket>[0]);

        expect(result).toEqual(expected);
    });

    it.each`
        marketNames    | marketType     | expected
        ${null}        | ${'core'}      | ${{ success: false, errorMessage: 'Expected market names to be an array' }}
        ${[]}          | ${'core'}      | ${{ success: false, errorMessage: 'Expected at least one market name' }}
        ${['unknown']} | ${'core'}      | ${{ success: false, errorMessage: 'Cannot find unknown market' }}
        ${['unknown']} | ${'ecosystem'} | ${{ success: false, errorMessage: 'Cannot find unknown market' }}
        ${['USDC']}    | ${'core'}      | ${{ success: true, data: { marketType: 'core', marketNames: ['USDC'], marketAddresses: [CORE_MARKETS.USDC] } }}
        ${['USDC']}    | ${'ecosystem'} | ${{ success: true, data: { marketType: 'ecosystem', marketNames: ['USDC'], marketAddresses: [ECOSYSTEM_MARKETS.USDC] } }}
    `('should return $expected when marketNames is $marketName and marketType is $marketType', ({ marketNames, marketType, expected }: UtilsParams<typeof parseMarketList>) => {
        const result = parseMarketList({ marketNames, marketType } as Parameters<typeof parseMarketList>[0]);

        expect(result).toEqual(expected);
    });
});
