import { Address } from 'viem';

export interface MarketInfo {
    isExpired: boolean;
    pendlePerSec: string;
    accumulatedPendle: string;
    lastUpdated: string;
    incentiveEndsAt: string;
}

export interface TransactionResult {
    success: boolean;
    message: string;
    hash?: string;
} 