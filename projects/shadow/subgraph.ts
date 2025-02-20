import { gql, request } from 'graphql-request';
import { SUBGRAPH_API_URL, SUBGRAPH_DOCS_PER_PAGE } from './constants.js';
import { AnyToken } from './tokens.js';
import { Address } from 'viem';

interface ClPoolsResponse {
    clPools: ClPool[];
}

interface ClPositionsResponse {
    clPositions: ClPosition[];
}

const poolsQuery = gql`
    query allPools($token0: String!, $token1: String!, $first: Int!, $skip: Int!) {
        clPools(where: { token0: $token0, token1: $token1 }, first: $first, skip: $skip) {
            __typename
            id
            feeTier
            tickSpacing
            totalValueLockedUSD
            symbol
        }
    }
`;

const positionsQuery = gql`
    query allPositions($owner: String!, $first: Int!, $skip: Int!) {
        clPositions(
            where: { liquidity_gt: 0, owner: $owner }
            first: $first
            skip: $skip
        ) {
            __typename
            id
            owner
            pool {
                id
                feeTier
                sqrtPrice
                liquidity
                tickSpacing
                tick
                symbol
            }
            token0 {
                id
                symbol
                decimals
                priceUSD
            }
            token1 {
                id
                symbol
                decimals
                priceUSD
            }
            liquidity
            tickLower {
                tickIdx
            }
            tickUpper {
                tickIdx
            }
        }
    }
`;

export async function getClPoolsByTokens(tokenA: AnyToken, tokenB: AnyToken) {
    const [token0, token1] = tokenA.wrapped.sortsBefore(tokenB.wrapped)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

    const getData = async (first: number, skip: number) =>
        request<ClPoolsResponse>(SUBGRAPH_API_URL, poolsQuery, {
            token0: token0.wrapped.address.toLowerCase(),
            token1: token1.wrapped.address.toLowerCase(),
            first,
            skip,
        }).then((data) => data.clPools);

    return paginate<ClPool>(getData, SUBGRAPH_DOCS_PER_PAGE);
}

export async function getClPositions(owner: Address) {
    const getData = async (first: number, skip: number) =>
        request<ClPositionsResponse>(SUBGRAPH_API_URL, positionsQuery, {
            owner: owner.toLowerCase(),
            first,
            skip,
        }).then((data) => data.clPositions);

    const positions = await paginate<ClPosition>(getData, SUBGRAPH_DOCS_PER_PAGE);

    return positions.map((position) => {
        const liquidity = Number(position.liquidity);
        const tickLower = Number(position.tickLower.tickIdx);
        const tickUpper = Number(position.tickUpper.tickIdx);
        const currentTick = Number(position.pool.tick);
        const sqrtPriceX96 = Number(position.pool.sqrtPrice);

        const sqrtRatioLower = Math.sqrt(1.0001 ** tickLower);
        const sqrtRatioUpper = Math.sqrt(1.0001 ** tickUpper);
        const sqrtPrice = sqrtPriceX96 / 2 ** 96;

        let amount0 = 0n;
        let amount1 = 0n;

        if (liquidity == 0) {
            return {
                ...position,
                amount0: 0n,
                amount1: 0n,
            };
        }

        if (currentTick < tickLower) {
            amount0 = BigInt(
                Math.floor(
                    liquidity *
                        (Math.abs(sqrtRatioUpper - sqrtRatioLower) /
                            (sqrtRatioLower * sqrtRatioUpper)),
                ),
            );
        } else if (currentTick < tickUpper) {
            amount0 = BigInt(
                Math.floor(
                    liquidity *
                        (Math.abs(sqrtRatioUpper - sqrtPrice) /
                            (sqrtPrice * sqrtRatioUpper)),
                ),
            );
        }

        if (currentTick < tickLower) {
            amount1 = 0n;
        } else if (currentTick >= tickLower && currentTick < tickUpper) {
            amount1 = BigInt(
                Math.floor(liquidity * Math.abs(sqrtPrice - sqrtRatioLower)),
            );
        } else {
            amount1 = BigInt(
                Math.floor(liquidity * Math.abs(sqrtRatioUpper - sqrtRatioLower)),
            );
        }

        return {
            ...position,
            amount0,
            amount1,
        };
    });
}

interface ClPool {
    __typename: 'ClPool';
    id: string;
    feeTier: string;
    tickSpacing: string;
    totalValueLockedUSD: string;
    symbol: string;
}

interface ClPosition {
    __typename: 'ClPosition';
    id: string;
    owner: string;
    liquidity: string;
    pool: {
        id: string;
        liquidity: string;
        sqrtPrice: string;
        tick: string;
        symbol: string;
        feeTier: string;
        tickSpacing: string;
    };
    token0: Token;
    token1: Token;
    tickLower: { tickIdx: string };
    tickUpper: { tickIdx: string };
}

interface Token {
    id: string;
    symbol: string;
    decimals: string;
    priceUSD: string;
}

export async function paginate<T>(
    getItems: (first: number, skip: number) => Promise<T[]>,
    itemsPerPage: number,
): Promise<T[]> {
    const items = new Array<T>();
    let skip = 0;
    while (true) {
        const newItems = await getItems(itemsPerPage, skip);

        items.push(...newItems);
        skip += itemsPerPage;

        if (newItems.length < itemsPerPage) {
            break;
        }

        // add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return items;
}
