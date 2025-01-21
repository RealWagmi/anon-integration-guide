export interface IPFeeDistributor {
    claimReward(pool: string, user: string): Promise<{
        totalReward: bigint;
    }>;

    userInfo(pool: string, user: string): Promise<{
        firstUnclaimedWeek: bigint;
        iter: bigint;
    }>;
} 