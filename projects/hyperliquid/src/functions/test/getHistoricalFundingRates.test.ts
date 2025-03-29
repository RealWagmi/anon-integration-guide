import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHistoricalFundingRates } from '../getHistoricalFundingRates';
import { toResult } from '@heyanon/sdk';
import { hyperliquidPerps } from '../../constants';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

describe('getHistoricalFundingRates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return formatted historical funding rates for a valid asset and time range', async () => {
        const mockResponse = {
            data: [
                { fundingRate: '0.0001', time: 1677657600000 }, // 2023-03-01 UTC
                { fundingRate: '-0.0002', time: 1677661200000 },
            ],
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps, timeRange: '1h' };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(
            toResult(`Historical funding rates for BTC over last 1h:\n` + `• 0.0100% at Wed, 01 Mar 2023 08:00:00 GMT\n` + `• -0.0200% at Wed, 01 Mar 2023 09:00:00 GMT`),
        );
        expect(mockedAxios.post).toHaveBeenCalledWith('https://api.hyperliquid.xyz/info', expect.objectContaining({ type: 'fundingHistory', coin: 'BTC' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    });

    it('should return error for invalid time range format', async () => {
        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps, timeRange: 'invalid' };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('Invalid time range format. Use e.g., "1h", "8h", "1w", "1m".', true));
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return error for invalid asset', async () => {
        const props = { asset: 'INVALID' as keyof typeof hyperliquidPerps, timeRange: '1h' };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('Invalid asset specified: INVALID', true));
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return no history message when no rates are found', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: [] });

        const props = { asset: 'ETH' as keyof typeof hyperliquidPerps, timeRange: '1w' };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('No funding rate history found for ETH in the last 1w', true));
    });

    it('should handle API failure', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'log');
        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult('Failed to fetch historical funding rates: Network error', true));
        expect(consoleSpy).toHaveBeenCalledWith('Historical funding rates error:', expect.any(Error));
    });

    it('should use default 24h range when timeRange is not provided', async () => {
        const mockResponse = {
            data: [{ fundingRate: '0.0003', time: 1677657600000 }],
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps };
        const result = await getHistoricalFundingRates(props, {} as any);

        expect(result).toEqual(toResult(`Historical funding rates for BTC over last 24h:\n` + `• 0.0300% at Wed, 01 Mar 2023 08:00:00 GMT`));
    });
});
