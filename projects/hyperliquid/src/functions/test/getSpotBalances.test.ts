import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSpotBalances } from '../getSpotBalances';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

describe('getSpotBalance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return formatted spot balances', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                balances: [
                    { coin: 'USDC', total: '1000.50' },
                    { coin: 'BTC', total: '0.5' },
                    { coin: 'ETH', total: '2.75' },
                    { coin: 'UNSUPPORTED', total: '10.0' }, // This one should be filtered out
                ],
            },
        });

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Spot balances on Hyperliquid:');
        expect(result.data).toContain('USDC: 1000.50');
        expect(result.data).toContain('BTC: 0.5');
        expect(result.data).toContain('ETH: 2.75');
        expect(result.data).not.toContain('UNSUPPORTED');

        expect(axios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/info',
            { type: 'spotClearinghouseState', user: account },
            { headers: { 'Content-Type': 'application/json' } },
        );
    });

    it('should return message when no balances exist', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                balances: [],
            },
        });

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('No supported assets found in your Hyperliquid spot account');
    });

    it('should return message when only unsupported assets exist', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                balances: [
                    { coin: 'UNSUPPORTED1', total: '5.0' },
                    { coin: 'UNSUPPORTED2', total: '10.0' },
                ],
            },
        });

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('No supported assets found in your Hyperliquid spot account');
    });

    it('should filter out zero balances', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                balances: [
                    { coin: 'USDC', total: '1000.00' },
                    { coin: 'BTC', total: '0.0' },
                    { coin: 'ETH', total: '0' },
                ],
            },
        });

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('USDC: 1000.00');
        expect(result.data).not.toContain('BTC');
        expect(result.data).not.toContain('ETH');
    });

    it('should return error when API returns invalid response format', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                // Missing balances array
            },
        });

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('No spot balances found or invalid response format');
    });

    it('should return error when API request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await getSpotBalances({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to fetch spot balance');
        expect(result.data).toContain('Network error');
    });

    it('should log debug information', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                balances: [{ coin: 'USDC', total: '100.00' }],
            },
        });

        await getSpotBalances({ account }, {} as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Getting spot balance for account:'), account);
    });
});
