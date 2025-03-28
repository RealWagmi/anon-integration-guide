import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFundingRate } from '../getFundingRate';
import { toResult } from '@heyanon/sdk';
import { hyperliquidPerps } from '../../constants';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

describe('getFundingRate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return the current funding rate for a valid asset', async () => {
        const mockResponse = {
            data: [{ universe: [{ name: 'BTC' }, { name: 'ETH' }] }, [{ funding: '0.0005' }, { funding: '-0.0001' }]],
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps };
        const result = await getFundingRate(props, {} as any);

        expect(result).toEqual(toResult(`Current funding rate:\n• BTC: 0.0500%`));
        expect(mockedAxios.post).toHaveBeenCalledWith('https://api.hyperliquid.xyz/info', { type: 'metaAndAssetCtxs' }, { headers: { 'Content-Type': 'application/json' } });
    });

    it('should return error for invalid asset not in hyperliquidPerps', async () => {
        const props = { asset: 'INVALID' as keyof typeof hyperliquidPerps };
        const result = await getFundingRate(props, {} as any);

        expect(result).toEqual(toResult('Invalid asset specified: INVALID', true));
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should return error if asset is not found in Hyperliquid data', async () => {
        const mockResponse = {
            data: [{ universe: [{ name: 'ETH' }] }, [{ funding: '-0.0001' }]],
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const props = { asset: 'BTC' as keyof typeof hyperliquidPerps };
        const result = await getFundingRate(props, {} as any);

        expect(result).toEqual(toResult('Asset BTC not found in Hyperliquid data', true));
    });

    it('should handle API failure', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'log');
        const props = { asset: 'ETH' as keyof typeof hyperliquidPerps };
        const result = await getFundingRate(props, {} as any);

        expect(result).toEqual(toResult('Failed to fetch current funding rate: Network error', true));
        expect(consoleSpy).toHaveBeenCalledWith('Current funding rate error:', expect.any(Error));
    });

    it('should return negative funding rate correctly', async () => {
        const mockResponse = {
            data: [{ universe: [{ name: 'BTC' }, { name: 'ETH' }] }, [{ funding: '0.0005' }, { funding: '-0.0001' }]],
        };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const props = { asset: 'ETH' as keyof typeof hyperliquidPerps };
        const result = await getFundingRate(props, {} as any);

        expect(result).toEqual(toResult(`Current funding rate:\n• ETH: -0.0100%`));
    });
});
