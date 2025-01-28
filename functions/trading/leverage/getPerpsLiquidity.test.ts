import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPerpsLiquidity } from './getPerpsLiquidity';
import { FunctionOptions } from '@heyanon/sdk';
import { getContract } from 'viem';

vi.mock('viem', () => ({
  getContract: vi.fn(() => ({
    address: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b',
    abi: [],
    read: {
      poolAmounts: vi.fn().mockResolvedValue(1000000000000000000n),
      reservedAmounts: vi.fn().mockResolvedValue(500000000000000000n),
      maxGlobalLongSizes: vi.fn().mockResolvedValue(10000000000000000000n),
      maxGlobalShortSizes: vi.fn().mockResolvedValue(8000000000000000000n),
      cumulativeFundingRates: vi.fn().mockResolvedValue(100000000n),
      getMaxPrice: vi.fn().mockResolvedValue(2000000000000000000n)
    }
  }))
}));

describe('getPerpsLiquidity', () => {
    const mockGetProvider = vi.fn();
    const mockNotify = vi.fn();
    const mockSendTransactions = vi.fn();

    const options: FunctionOptions = {
        getProvider: mockGetProvider,
        notify: mockNotify,
        sendTransactions: mockSendTransactions,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should retrieve liquidity information for a long position', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: '0x1234567890123456789012345678901234567890',
                indexToken: '0x1234567890123456789012345678901234567890',
                collateralToken: '0x2345678901234567890123456789012345678901',
                isLong: true,
            },
            options
        );

        const liquidityInfo = JSON.parse(result.data);
        expect(result.success).toBe(true);
        expect(liquidityInfo).toEqual({
            maxLeverage: 11,
            maxPositionSize: '10000000000000000000',
            maxCollateral: '909090909090909090',
            poolAmount: '1000000000000000000',
            reservedAmount: '500000000000000000',
            fundingRate: '100000000',
            availableLiquidity: '500000000000000000',
            priceUsd: '2000000000000000000'
        });
    });

    it('should retrieve liquidity information for a short position', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: '0x1234567890123456789012345678901234567890',
                indexToken: '0x1234567890123456789012345678901234567890',
                collateralToken: '0x2345678901234567890123456789012345678901',
                isLong: false,
            },
            options
        );

        const liquidityInfo = JSON.parse(result.data);
        expect(result.success).toBe(true);
        expect(liquidityInfo).toEqual({
            maxLeverage: 10,
            maxPositionSize: '8000000000000000000',
            maxCollateral: '800000000000000000',
            poolAmount: '1000000000000000000',
            reservedAmount: '500000000000000000',
            fundingRate: '100000000',
            availableLiquidity: '500000000000000000',
            priceUsd: '2000000000000000000'
        });
    });

    it('should handle unsupported chains', async () => {
        const result = await getPerpsLiquidity(
            {
                chainName: 'ethereum',
                account: '0x1234567890123456789012345678901234567890',
                indexToken: '0x1234567890123456789012345678901234567890',
                collateralToken: '0x2345678901234567890123456789012345678901',
                isLong: true,
            },
            options
        );

        expect(result.success).toBe(false);
        expect(result.data).toContain('This function is only supported on Sonic chain');
    });

    it('should handle contract errors', async () => {
        vi.mocked(getContract).mockImplementationOnce(() => ({
            address: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b',
            abi: [],
            read: {
                poolAmounts: vi.fn().mockRejectedValue(new Error('Contract call failed'))
            }
        }));

        const result = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: '0x1234567890123456789012345678901234567890',
                indexToken: '0x1234567890123456789012345678901234567890',
                collateralToken: '0x2345678901234567890123456789012345678901',
                isLong: true,
            },
            options
        );

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to get perpetual trading liquidity: Contract call failed');
    });
}); 
