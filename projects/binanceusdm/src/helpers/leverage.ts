import { Exchange, Leverage } from 'ccxt';

/**
 * Get the leverage tiers for the given market symbols;
 * returns a map of symbol to leverage tiers.
 *
 * @link https://docs.ccxt.com/#/README?id=leverage-tiers
 */
export async function getMarketsLeverageTiers(exchange: Exchange, symbols: string[]) {
    if (!exchange.has['fetchLeverageTiers']) {
        throw new Error(`Exchange ${exchange.name} does not support retrieving leverage tiers`);
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
        throw new Error(`Exchange ${exchange.name} does not support retrieving user leverage and margin mode`);
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
        throw new Error(`Exchange ${exchange.name} does not support setting user leverage`);
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
        throw new Error(`Exchange ${exchange.name} does not support setting user margin mode at the market level`);
    }
    return await exchange.setMarginMode(marginMode, market);
}
