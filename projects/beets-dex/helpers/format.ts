import { GqlPoolMinimal, GqlPoolBase } from './beets/types';
import { SimplifiedPool } from './pools';


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
        parts.push(`${offset}- Value $${pool.userBalanceUsd.toFixed(2)}`);
    }
    if (pool.userStakedBalanceUsd) {
        parts.push(`${offset}- Staked $${pool.userStakedBalanceUsd.toFixed(2)}`);
    }
    parts.push(`${offset}- APR: ${(pool.apr * 100).toFixed(2)}%`);
    if (pool.aprBoost) {
        parts.push(`${offset}- Max APR: ${(((pool.apr+pool.aprBoost) * 100).toFixed(2))}% when max staked`);
    }
    parts.push(`${offset}- TVL: $${pool.tvlUsd.toFixed(0)}`);
    parts.push(`${offset}- Pool ID: ${pool.id}`);
    parts.push(`${offset}- Pool type: ${formatPoolType(pool.type)}`);

    return parts.join('\n');
} 

/**
 * Given the position of a user in a pool, format it into a one-line string,
 * showing dollar value, APR and pool ID, similar to the https://beets.fi/pools page
 */
export function formatPositionOneLine(pool: GqlPoolMinimal | GqlPoolBase, bullet: string = ''): string {
        const tokens = pool.poolTokens
            .map((token) => {
                const weight = token.weight ? ` (${token.weight * 100}%)` : '';
                const symbol = token.underlyingToken ? token.underlyingToken.symbol : token.symbol;
                return `${symbol}${weight}`;
            })
            .join('-');
        
        const totalBalanceUsd = pool.userBalance?.totalBalanceUsd || 0;
        const apr = pool.dynamicData.aprItems.reduce((total, item) => total + item.apr, 0)

        let parts = [];
        if (bullet) parts.push(bullet);
        parts.push(`${pool.name} [${tokens}]:`);
        parts.push(`$${totalBalanceUsd.toFixed(2)},`);
        parts.push(`${(apr * 100).toFixed(2)}% APR,`);
        parts.push(`$${parseFloat(pool.dynamicData.totalLiquidity).toFixed(0)} TVL,`);
        parts.push(`ID: ${pool.id}`);

        return parts.join(' ');
}

/**
 * Given a pool type, format it into a human-readable string
 */
export function formatPoolType(type: string): string {
    return type
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}