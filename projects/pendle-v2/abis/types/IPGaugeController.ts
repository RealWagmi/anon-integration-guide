export interface IPGaugeController {
    redeemMarketReward(): Promise<void>;

    rewardData(market: string): Promise<{
        pendlePerSec: bigint;
        accumulatedPendle: bigint;
        lastUpdated: bigint;
        incentiveEndsAt: bigint;
    }>;
} 