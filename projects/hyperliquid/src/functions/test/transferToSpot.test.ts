import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferToSpot } from '../transferToSpot';
import { toResult } from '@heyanon/sdk';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

describe('transferToSpot', () => {
    const mockNotify = vi.fn((message: string) => Promise.resolve());
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
        amount: '100',
    };

    it('should prepare and send transfer transaction correctly', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await transferToSpot(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully initiated transfer of 100 USDC from perp to spot on Hyperliquid');

        expect(mockNotify).toHaveBeenCalledWith('Preparing to transfer funds between spot and perp balances on Hyperliquid...');

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/exchange',
            expect.objectContaining({
                action: expect.objectContaining({
                    type: 'usdClassTransfer',
                    amount: '100',
                    toPerp: false,
                }),
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
                response: 'Insufficient balance',
            },
        });

        const result = await transferToSpot(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to transfer funds between spot and perp balances on Hyperliquid');
    });

    it('should handle signature without v parameter for transfer', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x7f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc501',
        ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await transferToSpot(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully initiated transfer');
    });

    it('should return error if amount is invalid', async () => {
        const result = await transferToSpot({ amount: 'invalid-amount' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if amount is negative', async () => {
        const result = await transferToSpot({ amount: '-10' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if amount is zero', async () => {
        const result = await transferToSpot({ amount: '0' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if signTypedDatas is not available', async () => {
        const result = await transferToSpot(props, {
            notify: mockNotify,
            evm: {},
        } as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to transfer funds between spot and perp balances on Hyperliquid');
    });

    it('should return error if axios post request fails', async () => {
        mockSignTypedDatas.mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

        mockedAxios.post.mockRejectedValue(new Error('Network error'));

        const result = await transferToSpot(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to transfer funds between spot and perp balances on Hyperliquid');
    });

    it('should validate different amount formats', async () => {
        const testCases = [
            { amount: '1000', expectedSuccess: true, message: 'Successfully initiated transfer of 1000 USDC from perp to spot on Hyperliquid' },
            { amount: '1000.00', expectedSuccess: true, message: 'Successfully initiated transfer of 1000.00 USDC from perp to spot on Hyperliquid' },
            { amount: '1000.50', expectedSuccess: true, message: 'Successfully initiated transfer of 1000.50 USDC from perp to spot on Hyperliquid' },
            { amount: '0.1', expectedSuccess: true, message: 'Successfully initiated transfer of 0.1 USDC from perp to spot on Hyperliquid' },
            { amount: '.5', expectedSuccess: true, message: 'Successfully initiated transfer of .5 USDC from perp to spot on Hyperliquid' },
            { amount: '0', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: 'abc', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: '-100', expectedSuccess: false, message: 'Invalid amount specified' },
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

            const result = await transferToSpot({ amount: testCase.amount }, functionOptions as any);

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

        await transferToSpot(props, functionOptions as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting perp->spot transfer with:'), expect.any(Object));
    });

    it('should handle error during execution and log it', async () => {
        vi.clearAllMocks();

        mockSignTypedDatas.mockImplementation(() => {
            console.log('Spot/Perp transfer error:', new Error('Signature failed'));
            throw new Error('Signature failed');
        });

        const result = await transferToSpot(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to transfer funds between spot and perp balances on Hyperliquid');
    });
});
