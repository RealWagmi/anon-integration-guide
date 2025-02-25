export const TOKEN_MINTS = {
    SOL: 'So11111111111111111111111111111111111111112',
    ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    WBTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
} as const;

export type AssetType = keyof typeof TOKEN_MINTS;

export interface PerpsPosition {
    borrowRate: number;
    utilization: number;
    availableLiquidity: number;
}

export interface PerpsMarketData {
    long: {
        borrowRate: string;
        utilization: string;
        availableLiquidity: string;
    };
    short: {
        borrowRate: string;
        utilization: string;
        availableLiquidity: string;
    };
    openFee: string;
    timestamp: number;
}

export interface RateSnapshot {
    asset: AssetType;
    data: PerpsMarketData;
}

export interface HistoricalRates {
    asset: AssetType;
    snapshots: RateSnapshot[];
    period: {
        start: number;
        end: number;
    };
}

export interface PoolInfo {
    longAvailableLiquidity: string;
    longBorrowRatePercent: string;
    longUtilizationPercent: string;
    shortAvailableLiquidity: string;
    shortBorrowRatePercent: string;
    shortUtilizationPercent: string;
    openFeePercent: string;
    maxRequestExecutionSec: string;
}
