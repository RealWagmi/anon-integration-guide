import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPerpBalances } from '../getPerpBalances';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

describe('getPerpBalances', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return formatted perpetual balance', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                withdrawable: '1000.50',
                marginSummary: {
                    accountValue: '1500.75',
                    totalMarginUsed: '500.25',
                },
            },
        });

        const result = await getPerpBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Perp balance on Hyperliquid:');
        expect(result.data).toContain('• Available: $1000.50');

        expect(axios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            { headers: { 'Content-Type': 'application/json' } },
        );
    });

    it('should handle no balance information', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {},
        });

        const result = await getPerpBalances({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('No perpetual balance found or invalid response format');
    });

    it('should return error when API returns invalid response format', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                // Missing withdrawable field
            },
        });

        const result = await getPerpBalances({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('No perpetual balance found or invalid response format');
    });

    it('should handle zero balance', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                withdrawable: '0',
                marginSummary: {
                    accountValue: '0',
                },
            },
        });

        const result = await getPerpBalances({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Perp balance on Hyperliquid:');
        expect(result.data).toContain('• Available: $0.00');
    });

    it('should return error when API request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await getPerpBalances({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to fetch perpetual balance');
        expect(result.data).toContain('Network error');
    });

    it('should log debug information', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                withdrawable: '100.00',
            },
        });

        await getPerpBalances({ account }, {} as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Getting perpetual balance for account:'), account);
    });
});
