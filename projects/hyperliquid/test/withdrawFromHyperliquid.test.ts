import axios from 'axios';
import { Address } from 'viem';
import { withdrawFromHyperliquid } from '../functions';
import { ARBITRUM_CHAIN_ID, MIN_WITHDRAW_AMOUNT } from '../constants';
import { toResult } from '@heyanon/sdk';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

describe('withdrawFromHyperliquid', () => {
    const mockNotify = jest.fn((message: string) => {
        console.log(message);
        return Promise.resolve();
    });

    const mockProvider = jest.fn().mockReturnValue({
        readContract: jest.fn(),
        simulateContract: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const props = {
        chainName: 'arbitrum-one',
        account,
        amount: '100',
    };

    it('should prepare and send withdraw transaction correctly', async () => {
        const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
            console.log('Signing typed datas:', args);
            return Promise.resolve(['0x5ab40c899edec6de87fce05f2babe8ba378981d6e7e77324c64c5cd58c6af6d2'] as `0x${string}`[]);
        });

        jest.spyOn(require('@heyanon/sdk'), 'getChainFromName').mockImplementation((...args: unknown[]) => {
            const chainName = args[0] as string;
            if (chainName === 'arbitrum-one') return ARBITRUM_CHAIN_ID;
            if (chainName === 'ethereum') return 1;
            return null;
        });

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await withdrawFromHyperliquid(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('Successfully initiated withdraw of 100 USDC from Hyperliquid to Arbitrum');

        expect(mockNotify).toHaveBeenCalledWith('Preparing to withdraw USDC from Hyperliquid...');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/exchange',
            expect.objectContaining({
                action: expect.any(Object),
                nonce: expect.any(Number),
                signature: expect.any(Array),
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('should return error if no account is found', async () => {
        const result = await withdrawFromHyperliquid(
            { ...props, account: '' as Address },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Wallet not connected', true));
    });

    it('should return error if chain is unsupported', async () => {
        const result = await withdrawFromHyperliquid(
            { ...props, chainName: 'unsupported-chain' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Unsupported chain name: unsupported-chain', true));
    });

    it('should return error for unsupported chain', async () => {
        const result = await withdrawFromHyperliquid(
            { ...props, chainName: 'ethereum' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Withdrawing funds from Hyperliquid is only supported to Arbitrum', true));
    });

    it('should return error if amount is invalid', async () => {
        const result = await withdrawFromHyperliquid(
            { ...props, amount: 'invalid-amount' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if amount is less than minimum withdraw amount', async () => {
        const result = await withdrawFromHyperliquid(
            { ...props, amount: '0.1' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult(`Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC`, true));
    });

    it('should return error if signTypedDatas is not available', async () => {
        const result = await withdrawFromHyperliquid(props, {
            notify: mockNotify,
            signTypedDatas: undefined,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to withdraw funds from Hyperliquid. Please try again.', true));
    });

    it('should return error if axios post request fails', async () => {
        const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
            console.log('Signing typed datas:', args);
            return Promise.resolve(['0x5ab40c899edec6de87fce05f2babe8ba378981d6e7e77324c64c5cd58c6af6d2'] as `0x${string}`[]);
        });

        mockedAxios.post.mockRejectedValue(new Error('Network error'));

        const result = await withdrawFromHyperliquid(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to withdraw funds from Hyperliquid. Please try again.', true));
    });

    it('should return error for non-ok api response', async () => {
        const mockSignTypedDatas = jest.fn().mockResolvedValue(['0x5ab40c899edec6de87fce05f2babe8ba378981d6e7e77324c64c5cd58c6af6d2'] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'error',
                message: 'Some error',
            },
        });

        const result = await withdrawFromHyperliquid(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to withdraw funds from Hyperliquid. Please try again.', true));
    });

    it('should validate different amount formats', async () => {
        const testCases = [
            { amount: '1000', expectedSuccess: true, message: 'Successfully initiated withdraw of 1000 USDC from Hyperliquid to Arbitrum' },
            { amount: '1000.00', expectedSuccess: true, message: 'Successfully initiated withdraw of 1000.00 USDC from Hyperliquid to Arbitrum' },
            { amount: '1000.50', expectedSuccess: true, message: 'Successfully initiated withdraw of 1000.50 USDC from Hyperliquid to Arbitrum' },
            { amount: '0.1', expectedSuccess: false, message: `Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC` },
            { amount: '.5', expectedSuccess: false, message: `Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC` },
            { amount: '1,000', expectedSuccess: false, message: `Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC` },
            { amount: 'abc', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: '-100', expectedSuccess: false, message: `Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC` },
        ];

        for (const testCase of testCases) {
            const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
                console.log('Signing typed datas:', args);
                return Promise.resolve(['0x5ab40c899edec6de87fce05f2babe8ba378981d6e7e77324c64c5cd58c6af6d2'] as `0x${string}`[]);
            });

            if (testCase.expectedSuccess) {
                mockedAxios.post.mockResolvedValue({
                    data: {
                        status: 'ok',
                    },
                });
            } else {
                mockedAxios.post.mockRejectedValue(new Error('Network error'));
            }

            const result = await withdrawFromHyperliquid(
                { ...props, amount: testCase.amount },
                {
                    notify: mockNotify,
                    signTypedDatas: mockSignTypedDatas,
                    getProvider: mockProvider,
                    sendTransactions: jest.fn(),
                },
            );

            if (testCase.expectedSuccess) {
                expect(result.success).toEqual(true);
                expect(result.data).toContain(testCase.message);
            } else {
                expect(result).toEqual(toResult(testCase.message, true));
            }
        }
    });
});
