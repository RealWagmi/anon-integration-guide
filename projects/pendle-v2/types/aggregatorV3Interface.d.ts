declare module '@heyanon/sdk/src/blockchain/constants/aggregatorV3Interface' {
    export interface AggregatorV3Interface {
        latestRoundData(): Promise<{
            roundId: number;
            answer: number;
            startedAt: number;
            updatedAt: number;
            answeredInRound: number;
        }>;
        timeout(): Promise<number>;
    }
} 