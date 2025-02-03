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
 * Given the position of a user in a pool, format it into a one-line string,
 * showing dollar value, APR and pool ID, similar to the https://beets.fi/pools page
 */
export function formatPositionMinimal(pool: GqlPoolMinimal | GqlPoolBase, bullet: string = ''): string {
        const tokens = pool.poolTokens
            .map(token => `${token.symbol}${token.weight ? ` (${token.weight}%)` : ''}`)
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