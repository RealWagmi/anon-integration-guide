import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from 'viem';
import { withdrawFromHyperliquid } from '../withdrawFromHyperliquid';
import { ARBITRUM_CHAIN_ID, MIN_WITHDRAW_AMOUNT } from '../../constants';
import { toResult } from '@heyanon/sdk';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

vi.mock('@heyanon/sdk', async (importOriginal) => {
    const originalModule = (await importOriginal()) as Record<string, any>;
    return {
        ...originalModule,
        EVM: {
            ...originalModule.EVM,
            utils: {
                ...originalModule.EVM.utils,
                getChainFromName: vi.fn((chainName: string) => {
                    if (chainName === 'Arbitrum') return ARBITRUM_CHAIN_ID;
                    if (chainName === 'arbitrum-one') return ARBITRUM_CHAIN_ID;
                    if (chainName === 'Ethereum') return 1;
                    return null;
                }),
            },
        },
        toResult: originalModule.toResult || vi.fn((data, isError = false) => ({ success: !isError, data })),
    };
});

describe('withdrawFromHyperliquid', () => {
    const mockNotify = vi.fn(() => Promise.resolve());
    const mockSignTypedDatas = vi.fn();

    const functionOptions = {
        notify: mockNotify,
        evm: {
            signTypedDatas: mockSignTypedDatas,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const props = {
        chainName: 'arbitrum-one',
        account,
        amount: '100',
    };

    it('should prepare and send withdraw transaction correctly', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await withdrawFromHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully initiated withdraw of 100 USDC from Hyperliquid to Arbitrum');

        expect(mockNotify).toHaveBeenCalledWith('Preparing to withdraw USDC from Hyperliquid...');

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/exchange',
            expect.objectContaining({
                action: expect.any(Object),
                nonce: expect.any(Number),
                signature: expect.any(Object),
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('should handle non-ok API status with error message', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'error',
                error: 'Insufficient balance',
                details: 'User does not have enough funds',
            },
        });

        const result = await withdrawFromHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to withdraw funds from Hyperliquid. Please try again.');
    });

    it('should handle signature without v parameter for withdraw', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x7f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc501',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await withdrawFromHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully initiated withdraw');
    });

    it('should return error if no account is found', async () => {
        const result = await withdrawFromHyperliquid({ ...props, account: '' as Address }, functionOptions as any);

        expect(result).toEqual(toResult('Wallet not connected', true));
    });

    it('should return error if chain is unsupported', async () => {
        const result = await withdrawFromHyperliquid({ ...props, chainName: 'unsupported-chain' }, functionOptions as any);

        expect(result).toEqual(toResult('Unsupported chain name: unsupported-chain', true));
    });

    it('should return error for unsupported chain', async () => {
        const result = await withdrawFromHyperliquid({ ...props, chainName: 'Ethereum' }, functionOptions as any);

        expect(result).toEqual(toResult('Withdrawing funds from Hyperliquid is only supported to Arbitrum', true));
    });

    it('should return error if amount is invalid', async () => {
        const result = await withdrawFromHyperliquid({ ...props, amount: 'invalid-amount' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if amount is less than minimum withdraw amount', async () => {
        const result = await withdrawFromHyperliquid({ ...props, amount: '0.1' }, functionOptions as any);

        expect(result).toEqual(toResult(`Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC`, true));
    });

    it('should return error if signTypedDatas is not available', async () => {
        const result = await withdrawFromHyperliquid(props, {
            notify: mockNotify,
            evm: {},
        } as any);

        expect(result).toEqual(toResult('Failed to withdraw funds from Hyperliquid. Please try again.', true));
    });

    it('should return error if axios post request fails', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockRejectedValue(new Error('Network error'));

        const result = await withdrawFromHyperliquid(props, functionOptions as any);

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
            vi.clearAllMocks();

            if (testCase.expectedSuccess) {
                mockSignTypedDatas.mockResolvedValue([
                    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
                ] as `0x${string}`[]);

                mockedAxios.post.mockResolvedValue({
                    data: {
                        status: 'ok',
                    },
                });
            }

            const result = await withdrawFromHyperliquid({ ...props, amount: testCase.amount }, functionOptions as any);

            if (testCase.expectedSuccess) {
                expect(result.success).toBe(true);
                expect(result.data).toContain(testCase.message);
                expect(mockedAxios.post).toHaveBeenCalled();
            } else {
                expect(result.success).toBe(false);
                expect(result.data).toContain(testCase.message);
                expect(mockedAxios.post).not.toHaveBeenCalled();
            }
        }
    });

    it('should log debug information', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');

        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        await withdrawFromHyperliquid(props, functionOptions as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting withdraw with:'), expect.any(Object));
        expect(consoleLogSpy).toHaveBeenCalledWith('Chain ID:', expect.any(Number));
    });

    it('should handle error during execution and log it', async () => {
        vi.clearAllMocks();

        mockSignTypedDatas.mockImplementation(() => {
            console.error('Withdraw error:', new Error('Signature failed'));
            throw new Error('Signature failed');
        });

        const result = await withdrawFromHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to withdraw funds from Hyperliquid. Please try again.');
    });
});
