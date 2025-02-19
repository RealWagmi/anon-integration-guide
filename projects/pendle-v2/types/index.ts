import { type Address } from 'viem';

export interface MarketInfo {
    isExpired: boolean;
    pendlePerSec: bigint;
    accumulatedPendle: bigint;
    lastUpdated: bigint;
    incentiveEndsAt: bigint;
}

export interface GetMarketInfoParams {
    chainName: string;
    marketAddress: Address;
}

export interface ClaimRewardsParams {
    chainName: string;
    account: Address;
    marketAddress: Address;
}

export interface ClaimRewardsCallbacks {
    sendTransactions: (params: any) => Promise<any>;
    notify: (message: string) => Promise<void>;
    getProvider: () => any;
}

export interface Result<T> {
    success: boolean;
    data?: T;
    error?: Error | string;
} 