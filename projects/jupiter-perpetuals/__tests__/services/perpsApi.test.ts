import { PerpsApiService } from '../../services/perpsApi';
import { PoolInfo } from '../../types';

describe('PerpsApiService', () => {
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

    beforeEach(() => {
        // Properly type the global fetch mock
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockPoolInfo),
            status: 200,
            statusText: 'OK',
        } as Response);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('getPoolInfo', () => {
        it('should fetch pool info successfully', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockPoolInfo),
                statusText: 'OK',
            });

            const result = await PerpsApiService.getPoolInfo('testMint');
            expect(result).toEqual(mockPoolInfo);
            expect(fetch).toHaveBeenCalledWith('https://perps-api.jup.ag/v1/pool-info?mint=testMint');
        });

        it('should throw error when fetch fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
                status: 404,
            });

            await expect(PerpsApiService.getPoolInfo('testMint')).rejects.toThrow('API error: Not Found');
        });
    });

    describe('transformToMarketData', () => {
        it('should correctly transform pool info to market data', () => {
            // Mock Date.now() to have consistent timestamp in tests
            const mockTimestamp = new Date(2024, 0, 1).getTime();
            jest.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);

            const result = PerpsApiService.transformToMarketData(mockPoolInfo);

            expect(result).toEqual({
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
                timestamp: mockTimestamp,
            });

            // Restore Date.now()
            jest.spyOn(Date, 'now').mockRestore();
        });
    });
});
