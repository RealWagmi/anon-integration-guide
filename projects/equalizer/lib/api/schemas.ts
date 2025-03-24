import { Static, TSchema, Type } from '@sinclair/typebox';

const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

const minimalPairItemSchema = Type.Object({
    id: Type.Number(),
    displayName: Nullable(Type.String()),
    displayType: Type.String(),
    extendedType: Nullable(Type.String()),
    address: Type.String(),
    decimals: Type.Number(),
    isStable: Type.Boolean(),
    token0: Type.Object({
        symbol: Type.String(),
        address: Type.String(),
        decimals: Type.Number(),
    }),
    token1: Type.Object({
        symbol: Type.String(),
        address: Type.String(),
        decimals: Type.Number(),
    }),
    gauge: Nullable(
        Type.Object({
            address: Type.String(),
        })
    ),
});

export const minimalPairsResponseSchema = Type.Record(Type.String(), minimalPairItemSchema);

export type MinimalPairResponse = Static<typeof minimalPairsResponseSchema>;
export type MinimalPairResponseItem = MinimalPairResponse[number];

const nftRewardsItem = Type.Object({
    pairAddress: Type.String(),
    bribeAddress: Type.String(),
    tokens: Type.Array(
        Type.Object({
            address: Type.String(),
            symbol: Type.String(),
            amount: Type.Object({
                wei: Type.String(),
                value: Type.String(),
            }),
        })
    ),
    pair: Type.Object({
        id: Type.Number(),
        address: Type.String(),
        symbol: Type.String(),
        displayName: Type.String(),
        displayType: Type.String(),
        token0: Type.Object({
            address: Type.String(),
            symbol: Type.String(),
            decimals: Type.Number(),
        }),
        token1: Type.Object({
            address: Type.String(),
            symbol: Type.String(),
            decimals: Type.Number(),
        }),
        decimals: Type.Number(),
        extendedType: Nullable(Type.String()),
        stable: Type.Boolean(),
        tags: Type.Array(Type.String()),
    }),
});

export const rewardsByNftResponseSchema = Type.Record(Type.String(), nftRewardsItem);

export type RewardsByNFTResponse = Static<typeof rewardsByNftResponseSchema>;
export type RewardByNFTResponseItem = RewardsByNFTResponse[number];

const veNftV4Item = Type.Object({
    id: Type.Number(),
    lockAmount: Type.String(),
    lockEnds: Type.Number(),
    lockValue: Type.String(),
    isMaxLocked: Type.Boolean(),
    hasExpired: Type.Boolean(),
    isReset: Type.Boolean(),
    hasVotes: Type.Boolean(),
    hasVotedThisEpoch: Type.Boolean(),
    lastVoted: Type.Number(),
    needsResetToWithdraw: Type.Boolean(),
    canWithdraw: Type.Boolean(),
});

export const veNftV4ResponseSchema = Type.Array(veNftV4Item);

export type NftV4Response = Static<typeof veNftV4ResponseSchema>;
export type NftV4ResponseItem = NftV4Response[number];

const ecosystemStatsSchema = Type.Object({
    numTokens: Type.Number(),
    numPairs: Type.Number(),
    numGauges: Type.Number(),
});

const epochStatsSchema = Type.Object({
    totalIncentives: Type.Number(),
    incentivesPerVote: Type.Number(),
});

const historyStatsSchema = Type.Object({
    current: epochStatsSchema,
    lastEpoch: epochStatsSchema,
});

export const protocolStatsSchema = Type.Object({
    history: historyStatsSchema,
    blockTimestamp: Type.Number(),
    price: Type.Number(),
    priceFtm: Type.Number(),
    priceInFtm: Type.Number(),
    circulatingSupply: Type.Number(),
    outstandingSupply: Type.Number(),
    dilutedSupply: Type.Number(),
    inNFT: Type.Number(),
    inGauges: Type.Number(),
    inExcluded: Type.Number(),
    veEqualTotalSupply: Type.Number(),
    lockRatio: Type.Number(),
    liquidity: Type.Number(),
    circulatingMarketCap: Type.Number(),
    marketCap: Type.Number(),
    fdv: Type.Number(),
    lockedMarketCap: Type.Number(),
    totalTvl: Type.Number(),
    totalIncentives: Type.Number(),
    ecosystem: ecosystemStatsSchema,
});


export type ProtocolStatsResponse = Static<typeof protocolStatsSchema>;
