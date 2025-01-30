import { PublicKey } from '@solana/web3.js';

export interface Assets {
    feesReserves: number;
    owned: number;
    locked: number;
    guaranteedUsd: number;
    globalShortSizes: number;
    globalShortAveragePrices: number;
}

export interface FundingRateState {
    cumulativeInterestRate: number;
    lastUpdated: number;
    hourlyFundingDbps: number;
}

export interface JumpRateState {
    minRateBps: number;
    maxRateBps: number;
    targetRateBps: number;
    targetUtilizationRate: number;
}

export interface CustodyAccount {
    pool: PublicKey;
    mint: PublicKey;
    tokenAccount: PublicKey;
    decimals: number;
    isStable: boolean;
    assets: Assets;
    fundingRateState: FundingRateState;
    jumpRateState: JumpRateState;
}

export const CUSTODY_ACCOUNTS = {
    SOL: '7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz',
    ETH: 'AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn',
    BTC: '5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm',
    USDC: 'G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa',
    USDT: '4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk'
} as const;

export type AssetType = keyof typeof CUSTODY_ACCOUNTS;