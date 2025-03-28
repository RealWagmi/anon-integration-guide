import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSortedHistoricalFundingRates } from '../getSortedHistoricalFundingRates';
import { toResult } from '@heyanon/sdk';
import { hyperliquidPerps } from '../../constants';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

describe('getSortedHistoricalFundingRates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return sorted average funding rates for all assets', async () => {
        const mockResponses = {
            BTC: { data: [{ fundingRate: '0.0003' }, { fundingRate: '0.0001' }] },
            ETH: { data: [{ fundingRate: '-0.0001' }, { fundingRate: '0.0001' }] },
            LINK: { data: [{ fundingRate: '0.0005' }] },
            ARB: { data: [] },
            HYPE: { data: [{ fundingRate: '-0.0002' }] },
            PURR: { data: [{ fundingRate: '0.0004' }] },
        };

        mockedAxios.post
            .mockResolvedValueOnce(mockResponses.BTC)
            .mockResolvedValueOnce(mockResponses.ETH)
            .mockResolvedValueOnce(mockResponses.LINK)
            .mockResolvedValueOnce(mockResponses.ARB)
            .mockResolvedValueOnce(mockResponses.HYPE)
            .mockResolvedValueOnce(mockResponses.PURR);

        const props = { timeRange: '1h' };
        const result = await getSortedHistoricalFundingRates(props, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Average funding rates over last 1h (sorted highest to lowest)');

        const lines = result.data.split('\n');
        expect(lines).toContain('• LINK: 0.0500%');
        expect(lines).toContain('• PURR: 0.0400%');
        expect(lines).toContain('• BTC: 0.0200%');
        expect(lines).toContain('• ARB: 0.0000%');
        expect(lines).toContain('• ETH: 0.0000%');
        expect(lines).toContain('• HYPE: -0.0200%');

        const linkIndex = lines.indexOf('• LINK: 0.0500%');
        const purrIndex = lines.indexOf('• PURR: 0.0400%');
        const btcIndex = lines.indexOf('• BTC: 0.0200%');
        const arbIndex = lines.indexOf('• ARB: 0.0000%');
        const ethIndex = lines.indexOf('• ETH: 0.0000%');
        const hypeIndex = lines.indexOf('• HYPE: -0.0200%');

        expect(linkIndex).toBeLessThan(purrIndex);
        expect(purrIndex).toBeLessThan(btcIndex);
        expect(btcIndex).toBeLessThan(arbIndex);
        expect(btcIndex).toBeLessThan(ethIndex);
        expect(arbIndex).toBeLessThan(hypeIndex);
        expect(ethIndex).toBeLessThan(hypeIndex);

        expect(mockedAxios.post).toHaveBeenCalledTimes(Object.keys(hyperliquidPerps).length);
    });

    it('should return error for invalid time range format', async () => {
        const props = { timeRange: 'invalid' };
        const result = await getSortedHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('Invalid time range format. Use e.g., "1h", "8h", "1w", "1m".', true));
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle all assets with no data', async () => {
        Object.keys(hyperliquidPerps).forEach(() => {
            mockedAxios.post.mockResolvedValueOnce({ data: [] });
        });

        const props = { timeRange: '1w' };
        const result = await getSortedHistoricalFundingRates(props, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Average funding rates over last 1w (sorted highest to lowest)');

        const lines = result.data.split('\n');
        expect(lines).toContain('• ARB: 0.0000%');
        expect(lines).toContain('• BTC: 0.0000%');
        expect(lines).toContain('• ETH: 0.0000%');
        expect(lines).toContain('• HYPE: 0.0000%');
        expect(lines).toContain('• LINK: 0.0000%');
        expect(lines).toContain('• PURR: 0.0000%');

        expect(mockedAxios.post).toHaveBeenCalledTimes(Object.keys(hyperliquidPerps).length);
    });

    it('should handle API failure for one asset', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: [{ fundingRate: '0.0001' }] })
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ data: [{ fundingRate: '0.0002' }] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] });

        const consoleSpy = vi.spyOn(console, 'log');
        const props = { timeRange: '1h' };
        const result = await getSortedHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('Failed to fetch sorted funding rates: Network error', true));
        expect(consoleSpy).toHaveBeenCalledWith('Sorted historical funding rates error:', expect.any(Error));
    });

    it('should use default 24h range when timeRange is not provided', async () => {
        mockedAxios.post.mockResolvedValue({ data: [{ fundingRate: '0.0001' }] });

        const props = {};
        const result = await getSortedHistoricalFundingRates(props, {} as any);

        expect(result.data).toContain('Average funding rates over last 24h (sorted highest to lowest)');
        expect(mockedAxios.post).toHaveBeenCalledTimes(Object.keys(hyperliquidPerps).length);
    });
});
