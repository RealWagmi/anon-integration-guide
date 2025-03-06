import { describe, it, expect, vi, beforeEach } from 'vitest';
import { closePerp } from '../closePerp';
import { toResult } from '@heyanon/sdk';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('../openPerp', () => ({
    openPerp: vi.fn(),
}));

import axios from 'axios';
import { openPerp } from '../openPerp';

const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };
const mockedOpenPerp = openPerp as ReturnType<typeof vi.fn>;

describe('closePerp', () => {
    const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;
    const asset = 'ETH';

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

    it("should return an error if the user doesn't have a perp in that asset", async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [],
                withdrawable: '1000',
            },
        });

        const result = await closePerp({ account, asset }, functionOptions as any);

        expect(result).toEqual(toResult("You don't have a perp in that asset.", true));
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            { headers: { 'Content-Type': 'application/json' } },
        );
    });

    it('should successfully close a long position', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: asset,
                            szi: '15',
                            leverage: { value: 3 },
                        },
                    },
                ],
                withdrawable: '1000',
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Successfully closed position.'));

        const result = await closePerp({ account, asset }, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toBe('Successfully closed position.');

        expect(openPerp).toHaveBeenCalledWith(
            {
                account,
                asset,
                size: '15',
                sizeUnit: 'ASSET',
                leverage: 3,
                short: true,
                closing: true,
            },
            functionOptions,
        );
    });

    it('should successfully close a short position', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: asset,
                            szi: '-10',
                            leverage: { value: 5 },
                        },
                    },
                ],
                withdrawable: '1000',
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Successfully closed position.'));

        const result = await closePerp({ account, asset }, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toBe('Successfully closed position.');

        expect(openPerp).toHaveBeenCalledWith(
            {
                account,
                asset,
                size: '10',
                sizeUnit: 'ASSET',
                leverage: 5,
                short: false,
                closing: true,
            },
            functionOptions,
        );
    });

    it('should return error if openPerp fails', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: asset,
                            szi: '15',
                            leverage: { value: 3 },
                        },
                    },
                ],
                withdrawable: '1000',
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Failed to open position', true));

        const result = await closePerp({ account, asset }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close position on Hyperliquid. Please try again.');
    });

    it('should return error if the axios request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await closePerp({ account, asset }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close position on Hyperliquid. Please try again.');
    });

    it('should properly handle different assets', async () => {
        const btcAsset = 'BTC';

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: btcAsset,
                            szi: '2',
                            leverage: { value: 10 },
                        },
                    },
                ],
                withdrawable: '1000',
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Successfully closed position.'));

        const result = await closePerp({ account, asset: btcAsset }, functionOptions as any);

        expect(result.success).toBe(true);
        expect(openPerp).toHaveBeenCalledWith(
            expect.objectContaining({
                asset: btcAsset,
            }),
            functionOptions,
        );
    });

    it('should log errors properly when openPerp fails', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: asset,
                            szi: '15',
                            leverage: { value: 3 },
                        },
                    },
                ],
                withdrawable: '1000',
            },
        });

        const errorMessage = 'Position error';
        mockedOpenPerp.mockResolvedValueOnce(toResult(errorMessage, true));

        await closePerp({ account, asset }, functionOptions as any);

        expect(consoleLogSpy).toHaveBeenCalledWith('Close perp error:', expect.stringContaining('Position error'));
    });
});
