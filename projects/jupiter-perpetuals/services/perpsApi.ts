import { PoolInfo, PerpsMarketData } from '../types';

export class PerpsApiService {
    static async getPoolInfo(mint: string): Promise<PoolInfo> {
        const response = await fetch(`https://perps-api.jup.ag/v1/pool-info?mint=${mint}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText || response.status}`);
        }

        const data = (await response.json()) as unknown;

        if (this.isPoolInfo(data)) {
            return data;
        }

        throw new Error('Invalid response format from API');
    }

    static transformToMarketData(poolInfo: PoolInfo): PerpsMarketData {
        return {
            long: {
                borrowRate: poolInfo.longBorrowRatePercent,
                utilization: poolInfo.longUtilizationPercent,
                availableLiquidity: poolInfo.longAvailableLiquidity,
            },
            short: {
                borrowRate: poolInfo.shortBorrowRatePercent,
                utilization: poolInfo.shortUtilizationPercent,
                availableLiquidity: poolInfo.shortAvailableLiquidity,
            },
            openFee: poolInfo.openFeePercent,
            timestamp: Date.now(),
        };
    }

    private static isPoolInfo(data: unknown): data is PoolInfo {
        if (!data || typeof data !== 'object') return false;

        const requiredFields = [
            'longBorrowRatePercent',
            'shortBorrowRatePercent',
            'longUtilizationPercent',
            'shortUtilizationPercent',
            'longAvailableLiquidity',
            'shortAvailableLiquidity',
            'openFeePercent',
            'maxRequestExecutionSec',
        ] as const;

        return requiredFields.every((field) => {
            const record = data as Record<string, unknown>;
            return field in record && typeof record[field] === 'string';
        });
    }
}
