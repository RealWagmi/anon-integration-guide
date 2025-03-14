import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPerpPositions } from '../getPerpPositions';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

describe('getPerpPositions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return formatted perpetual positions', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'BTC',
                            szi: '1.5',
                            entryPx: '50000',
                            positionValue: '75000',
                            leverage: { value: '10' },
                            unrealizedPnl: '5000',
                            liquidationPx: '45000',
                        },
                    },
                    {
                        position: {
                            coin: 'ETH',
                            szi: '-3',
                            entryPx: '3000',
                            positionValue: '9000',
                            leverage: { value: '5' },
                            unrealizedPnl: '-500',
                            liquidationPx: '3400',
                        },
                    },
                ],
                marginSummary: {
                    accountValue: '85000',
                },
                withdrawable: '10000',
            },
        });

        const result = await getPerpPositions({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('=== HYPERLIQUID PERPETUAL POSITIONS ===');
        expect(result.data).toContain('Position #1: LONG BTC (10x)');
        expect(result.data).toContain('Position #2: SHORT ETH (5x)');
        expect(result.data).toContain('Account Value: $85000.00');
        expect(result.data).toContain('Withdrawable: $10000.00');

        expect(axios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            { headers: { 'Content-Type': 'application/json' } },
        );
    });

    it('should handle no open positions', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [],
                marginSummary: {
                    accountValue: '10000.25',
                },
                withdrawable: '10000.25',
            },
        });

        const result = await getPerpPositions({ account }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('No open positions on Hyperliquid');
        expect(result.data).toContain('Account Value: $10000.25');
        expect(result.data).toContain('Withdrawable: $10000.25');
    });

    it('should return error when API returns invalid response format', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                // Missing assetPositions array
            },
        });

        const result = await getPerpPositions({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('No perpetual positions found or invalid response format');
    });

    it('should correctly format positions with positive and negative values', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'BTC',
                            szi: '1.5',
                            entryPx: '50000',
                            positionValue: '75000',
                            leverage: { value: '10' },
                            unrealizedPnl: '5000',
                            liquidationPx: '45000',
                        },
                    },
                    {
                        position: {
                            coin: 'ETH',
                            szi: '-3',
                            entryPx: '3000',
                            positionValue: '9000',
                            leverage: { value: '5' },
                            unrealizedPnl: '-500',
                            liquidationPx: '3400',
                        },
                    },
                ],
                marginSummary: {
                    accountValue: '85000',
                },
                withdrawable: '10000',
            },
        });

        const result = await getPerpPositions({ account }, {} as any);

        // Check direction is correctly determined
        expect(result.data).toContain('LONG BTC');
        expect(result.data).toContain('SHORT ETH');

        // Check PnL formatting
        expect(result.data).toContain('PnL: $5000.00');
        expect(result.data).toContain('PnL: $-500.00');
    });

    it('should return error when API request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await getPerpPositions({ account }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to fetch perpetual positions');
        expect(result.data).toContain('Network error');
    });

    it('should log debug information', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [],
                marginSummary: {
                    accountValue: '1000',
                },
                withdrawable: '1000',
            },
        });

        await getPerpPositions({ account }, {} as any);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Getting perpetual positions for account:'), account);
    });
});
