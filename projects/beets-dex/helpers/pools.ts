import { GqlPoolAprItemType, GqlPoolBase, GqlPoolMinimal } from './beets/types';

/**
 * Types of APR items returned by the API that we should consider
 * to compute the total APR yield of a pool.  Please note that
 * the Staking Boost APR deriving from staking the protocol token
 * is not considered here, but instead is added in the `computePoolTotalApr`
 * function.
 */
export const VALID_APR_TYPES = [
    GqlPoolAprItemType.Aura,
    GqlPoolAprItemType.IbYield,
    GqlPoolAprItemType.Locking,
    GqlPoolAprItemType.MabeetsEmissions,
    GqlPoolAprItemType.Merkl,
    GqlPoolAprItemType.Nested,
    GqlPoolAprItemType.Staking,
    GqlPoolAprItemType.Surplus_24H,
    GqlPoolAprItemType.SwapFee_24H,
    GqlPoolAprItemType.VebalEmissions,
    GqlPoolAprItemType.Voting,
];

export interface SimplifiedPool {
    name: string;
    type: string;
    tokens: SimplifiedPoolToken[];
    userBalanceUsd: number | null;
    userStakedBalanceUsd: number | null;
    tvlUsd: number;
    apr: number;
    aprBoost: number | null;
    id: string;
}

export interface SimplifiedPoolToken {
    name: string;
    symbol: string;
    weight: number | null;
}

/**
 * Utility function to convert a pool object from the API to
 * a simplified pool object, including:
 * - Name of the pool
 * - Tokens in the pool
 * - Value of position held by the user (if any)
 * - Total APR yield of the pool
 * - Minimum APR yield of the pool, if the pool has a staking boost
 * - TVL of the pool in USD
 * - Pool ID
 * - Pool type
 */
export function simplifyPool(pool: GqlPoolMinimal): SimplifiedPool {
    const [minApr, maxApr] = computePoolTotalApr(pool);
    return {
        name: pool.name,
        type: formatPoolType(pool.type),
        tokens: pool.poolTokens.map((token) => ({
            name: token.name,
            symbol: token.underlyingToken ? token.underlyingToken.symbol : token.symbol,
            weight: token.weight ? parseFloat(token.weight) : null,
        })),
        userBalanceUsd: pool.userBalance?.totalBalanceUsd || null,
        userStakedBalanceUsd: pool.userBalance?.stakedBalances.reduce((total, balance) => total + balance.balanceUsd, 0) || null,
        tvlUsd: parseFloat(pool.dynamicData.totalLiquidity),
        apr: minApr,
        aprBoost: getPoolStakingBoostApr(pool),
        id: pool.id,
    };
}

/**
 * Given a pool from the API, compute the total APR yield of the pool.
 *
 * This is expressed as a range, since the APR can be increased by
 * staking the protocol token.
 */
export function computePoolTotalApr(pool: GqlPoolMinimal | GqlPoolBase): [number, number] {
    const validAprItems = pool.dynamicData.aprItems.filter((item) => VALID_APR_TYPES.includes(item.type));
    const minTotalApr = validAprItems.reduce((total, item) => total + item.apr, 0);
    const maxTotalApr = minTotalApr + getPoolStakingBoostApr(pool);
    return [minTotalApr, maxTotalApr];
}

/**
 * Given a pool from the API, return the APR boost from max staking the
 * protocol token.
 */
export function getPoolStakingBoostApr(pool: GqlPoolMinimal | GqlPoolBase): number {
    const stakingBoostAprItem = pool.dynamicData.aprItems.find((item) => item.type === GqlPoolAprItemType.StakingBoost);
    if (!stakingBoostAprItem) {
        return 0;
    }
    return stakingBoostAprItem.apr;
}

/**
 * Check if a pool contains a specific token, including in nested pools and
 * underlying tokens
 */
export function poolContainsToken(pool: GqlPoolMinimal | GqlPoolBase, tokenAddress: string): boolean {
    // Normalize addresses for comparison
    const normalizedSearchAddress = tokenAddress.toLowerCase();

    return pool.poolTokens.some((token) => {
        // Check direct token address
        if (token.address.toLowerCase() === normalizedSearchAddress) return true;

        // Check underlying token if it exists
        if (token.underlyingToken?.address.toLowerCase() === normalizedSearchAddress) return true;

        // Check nested pool tokens if they exist
        if (token.nestedPool?.tokens) {
            return token.nestedPool.tokens.some(
                (nestedToken) => nestedToken.address.toLowerCase() === normalizedSearchAddress || nestedToken.underlyingToken?.address.toLowerCase() === normalizedSearchAddress,
            );
        }

        return false;
    });
}

/**
 * Given a pool, format it into a multi-line string, with just the essential
 * information, including the pool ID.
 *
 * If the pool is a user position, also show the user's position balance.
 */
export function formatPoolMinimal(pool: SimplifiedPool, titlePrefix: string = ''): string {
    const tokens = pool.tokens
        .map((token) => {
            const weight = token.weight ? ` (${token.weight * 100}%)` : '';
            return `${token.symbol}${weight}`;
        })
        .join('-');

    let parts = [];
    parts.push(`${titlePrefix}${pool.name} [${tokens}]:`);
    const offset = '   ';
    if (pool.userBalanceUsd) {
        parts.push(`${offset}- User position $${pool.userBalanceUsd.toFixed(2)}`);
    }
    if (pool.userStakedBalanceUsd) {
        parts.push(`${offset}- User staked position $${pool.userStakedBalanceUsd.toFixed(2)}`);
    }
    parts.push(`${offset}- APR: ${(pool.apr * 100).toFixed(2)}%`);
    if (pool.aprBoost) {
        parts.push(`${offset}- APR with max staking: ${((pool.apr + pool.aprBoost) * 100).toFixed(2)}%`);
    }
    parts.push(`${offset}- TVL: $${pool.tvlUsd.toFixed(0)}`);
    parts.push(`${offset}- Pool ID: ${pool.id}`);
    parts.push(`${offset}- Pool type: ${formatPoolType(pool.type)}`);

    return parts.join('\n');
}

/**
 * Given a pool type, format it into a human-readable string
 */
export function formatPoolType(type: string): string {
    return type
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
