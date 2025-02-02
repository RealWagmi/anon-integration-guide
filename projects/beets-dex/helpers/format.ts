import { GqlPoolMinimal, GqlPoolBase } from './beets/types';

/**
 * Given the position of a user in a pool, format it into a multi-line string
 */
export function formatPosition(pool: GqlPoolMinimal | GqlPoolBase): string {
    const tokens = pool.poolTokens
        .map(token => `${token.symbol}: ${token.balance}${token.weight ? ` (${token.weight}%)` : ''}`)
        .join(', ');

    const userBalanceInfo = pool.userBalance ? [
        `Total Balance: ${pool.userBalance.totalBalance} ($${pool.userBalance.totalBalanceUsd.toFixed(2)})`,
        `Wallet Balance: ${pool.userBalance.walletBalance} ($${pool.userBalance.walletBalanceUsd.toFixed(2)})`,
        ...pool.userBalance.stakedBalances.map(staked => 
            `Staked (${staked.stakingType}): ${staked.balance} ($${staked.balanceUsd.toFixed(2)})`
        )
    ].join('\n') : 'No balance';

    const aprInfo = pool.dynamicData.aprItems
        .map(item => `${item.type}: ${item.apr.toFixed(2)}%`)
        .join(', ');

    return [
        `Pool: ${pool.name} (${pool.type})`,
        `Tokens: ${tokens}`,
        `Balance:\n${userBalanceInfo}`,
        `APR: ${aprInfo}`,
        `Total Liquidity: $${Number(pool.dynamicData.totalLiquidity).toFixed(2)}`
    ].join('\n');
}

/**
 * Given a list of pool positions of a user, format them into a multi-line string
 * where each line is a pool position
 */
export function formatPositions(pools: (GqlPoolMinimal | GqlPoolBase)[]): string {
    return pools.map(pool => {
        const tokens = pool.poolTokens
            .map(token => `${token.symbol}${token.weight ? ` (${token.weight}%)` : ''}`)
            .join('-');
        
        const totalBalanceUsd = pool.userBalance?.totalBalanceUsd || 0;
        const apr = pool.dynamicData.aprItems
            .reduce((total, item) => total + item.apr, 0)
            .toFixed(2);

        return `${pool.name}: $${totalBalanceUsd.toFixed(2)} [${tokens}] (${apr}% APR)`;
    }).join('\n');
} 