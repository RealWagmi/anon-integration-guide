import { getBorrowRates } from '../../functions/getBorrowRates';
import { PerpsApiService } from '../../services/perpsApi';
import { TOKEN_MINTS, PerpsMarketData, PoolInfo } from '../../types';

// Mock the PerpsApiService
jest.mock('../../services/perpsApi');

describe('getBorrowRates', () => {
    const mockPoolInfo: PoolInfo = {
        longAvailableLiquidity: '1000000',
        longBorrowRatePercent: '10.5',
        longUtilizationPercent: '75.5',
        shortAvailableLiquidity: '2000000',
        shortBorrowRatePercent: '12.5',
        shortUtilizationPercent: '80.5',
        openFeePercent: '0.1',
        maxRequestExecutionSec: '30',
    };

    const mockMarketData: PerpsMarketData = {
        long: {
            borrowRate: '10.5',
            utilization: '75.5',
            availableLiquidity: '1000000',
        },
        short: {
            borrowRate: '12.5',
            utilization: '80.5',
            availableLiquidity: '2000000',
        },
        openFee: '0.1',
        timestamp: Date.now(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (PerpsApiService.getPoolInfo as jest.Mock).mockResolvedValue(mockPoolInfo);
        (PerpsApiService.transformToMarketData as jest.Mock).mockReturnValue(mockMarketData);
    });

    it('should return rates for valid asset', async () => {
        const result = await getBorrowRates({ asset: 'SOL' });

        expect(result.success).toBe(true);
        expect(result.data).not.toContain('ERROR: ');
        expect(PerpsApiService.getPoolInfo).toHaveBeenCalledWith(TOKEN_MINTS['SOL']);

        const parsedData = JSON.parse(result.data);
        expect(parsedData).toMatchObject({
            asset: 'SOL',
            long: {
                borrowRate: '10.5',
                utilization: '75.5',
                availableLiquidity: '1000000',
            },
            short: {
                borrowRate: '12.5',
                utilization: '80.5',
                availableLiquidity: '2000000',
            },
            openFee: '0.1',
        });
    });

    it('should return error for invalid asset', async () => {
        const result = await getBorrowRates({ asset: 'INVALID' as keyof typeof TOKEN_MINTS });

        expect(result.success).toBe(false);
        expect(result.data).toContain('ERROR: Invalid asset');
        expect(PerpsApiService.getPoolInfo).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
        const errorMessage = 'API Error';
        (PerpsApiService.getPoolInfo as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const result = await getBorrowRates({ asset: 'SOL' });

        expect(result.success).toBe(false);
        expect(result.data).toContain('ERROR: Error fetching borrow rates');
        expect(result.data).toContain(errorMessage);
    });

    it('should handle transformation errors gracefully', async () => {
        (PerpsApiService.transformToMarketData as jest.Mock).mockImplementation(() => {
            throw new Error('Transform Error');
        });

        const result = await getBorrowRates({ asset: 'SOL' });

        expect(result.success).toBe(false);
        expect(result.data).toContain('ERROR: Error fetching borrow rates');
        expect(result.data).toContain('Transform Error');
    });
});
