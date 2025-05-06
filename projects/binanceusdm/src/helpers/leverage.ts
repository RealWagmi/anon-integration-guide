import { Exchange } from 'ccxt';

/**
 * Get the leverage tiers for the given market symbols;
 * returns a map of symbol to leverage tiers.
 *
 * @link https://docs.ccxt.com/#/README?id=leverage-tiers
 */
export async function getMarketsLeverageTiers(symbols: string[], exchange: Exchange) {
    if (!exchange.has['fetchLeverageTiers']) {
        throw new Error(`Exchange ${exchange.name} does not support retrieving leverage tiers`);
    }
    return await exchange.fetchLeverageTiers(symbols);
}
