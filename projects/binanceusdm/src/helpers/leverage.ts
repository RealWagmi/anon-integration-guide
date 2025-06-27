import { Exchange, Leverage, MarginModification } from 'ccxt';

/**
 * Get the leverage tiers for the given market symbols;
 * returns a map of symbol to leverage tiers.
 *
 * @link https://docs.ccxt.com/#/README?id=leverage-tiers
 */
export async function getMarketsLeverageTiers(exchange: Exchange, symbols: string[]) {
    if (!exchange.has['fetchLeverageTiers']) {
        throw new Error(`Retrieving leverage tiers not supported on exchange ${exchange.name}`);
    }
    return await exchange.fetchLeverageTiers(symbols);
}

/**
 * Get the user configured leverage and margin mode for a specific market.
 *
 * @link https://docs.ccxt.com/#/README?id=leverage
 */
export async function getUserLeverageOnMarket(exchange: Exchange, market: string): Promise<Leverage> {
    if (!exchange.has['fetchLeverage']) {
        throw new Error(`Retrieving user leverage not supported on exchange ${exchange.name}`);
    }
    const leverageStructure = await exchange.fetchLeverage(market);
    if (leverageStructure.longLeverage !== leverageStructure.shortLeverage) {
        throw new Error(`Found different values for long and short leverage on market ${market}: Not supported yet`);
    }
    return leverageStructure;
}

/**
 * Set the user configured leverage for a specific market.
 *
 * @link https://docs.ccxt.com/#/README?id=leverage
 */
export async function setUserLeverageOnMarket(exchange: Exchange, market: string, leverage: number) {
    if (!exchange.has['setLeverage']) {
        throw new Error(`Setting user leverage not supported on exchange ${exchange.name}`);
    }
    return await exchange.setLeverage(leverage, market);
}

/**
 * Set the user configured margin mode for a specific market.
 *
 * @link https://docs.ccxt.com/#/README?id=set-margin-mode
 */
export async function setUserMarginModeOnMarket(exchange: Exchange, market: string, marginMode: 'cross' | 'isolated') {
    if (!exchange.has['setMarginMode']) {
        throw new Error(`Setting user margin mode not supported on exchange ${exchange.name}`);
    }
    return await exchange.setMarginMode(marginMode, market);
}

/**
 * Add margin to an isolated margin position.
 *
 * @link https://docs.ccxt.com/#/README?id=margin
 */
export async function addMarginToIsolatedPosition(exchange: Exchange, market: string, amount: number): Promise<MarginModification> {
    if (!exchange.has['addMargin']) {
        throw new Error(`Adding margin to isolated positions not supported on exchange ${exchange.name}`);
    }
    const leverageStructure = await getUserLeverageOnMarket(exchange, market);
    if (leverageStructure.marginMode !== 'isolated') {
        throw new Error(`Cannot add margin to ${market}: not an isolated margin position`);
    }
    return await exchange.addMargin(market, amount);
}

/**
 * Reduce margin from an isolated margin position.
 *
 * @link https://docs.ccxt.com/#/README?id=margin
 */
export async function reduceMarginFromIsolatedPosition(exchange: Exchange, market: string, amount: number): Promise<MarginModification> {
    if (!exchange.has['reduceMargin']) {
        throw new Error(`Reducing margin from isolated positions not supported on exchange ${exchange.name}`);
    }
    const leverageStructure = await getUserLeverageOnMarket(exchange, market);
    if (leverageStructure.marginMode !== 'isolated') {
        throw new Error(`Can't reduce margin from ${market} – position is not an isolated margin position`);
    }
    return await exchange.reduceMargin(market, amount);
}
