import { gql, request } from 'graphql-request';
import { SUBGRAPH_API_URL, SUBGRAPH_DOCS_PER_PAGE } from './constants.js';
import { AnyToken } from './tokens.js';

interface ClQueryResponse {
    clPools: ClPool[];
}

const clQuery = gql`
    query allPools($token0: String!, $token1: String!, $first: Int!, $skip: Int!) {
        clPools(where: { token0: $token0, token1: $token1 }, first: $first, skip: $skip) {
            __typename
            id
            feeTier
            tickSpacing
            totalValueLockedUSD
        }
    }
`;

export async function getClPoolsByTokens(tokenA: AnyToken, tokenB: AnyToken) {
    const [token0, token1] = tokenA.wrapped.sortsBefore(tokenB.wrapped)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

    const getData = async (first: number, skip: number) =>
        request<ClQueryResponse>(SUBGRAPH_API_URL, clQuery, {
            token0: token0.wrapped.address.toLowerCase(),
            token1: token1.wrapped.address.toLowerCase(),
            first,
            skip,
        }).then((data) => data.clPools);

    return paginate<ClPool>(getData, SUBGRAPH_DOCS_PER_PAGE);
}

interface ClPool {
    __typename: 'ClPool';
    id: string;
    feeTier: string;
    tickSpacing: string;
    totalValueLockedUSD: string;
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
