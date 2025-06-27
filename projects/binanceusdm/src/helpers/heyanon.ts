/**
 * Helper functions involving objects provided by the HeyAnon SDK.
 */

import { Exchange, MarketInterface } from 'ccxt';
import { completeMarketSymbol, getMarketObject } from './markets';

/**
 * Return the market (trading pair) object for the given market
 * symbol.
 *
 * Optionally, allow the user to specify a partial market
 * symbol, without the settlement currency; the settlement
 * currency will be inferred as the quote currency, e.g.
 * "BTC/USDT" becomes "BTC/USDT:USDT".
 */
export async function getMarketBySymbol(exchange: Exchange, symbol: string, inferSettlementCurrency: boolean = true, notify: (message: string) => void): Promise<MarketInterface> {
    if (inferSettlementCurrency) {
        symbol = sanitizeMarketSymbol(symbol, notify);
    }
    return await getMarketObject(exchange, symbol);
}

/**
 * Allow for market symbols to be specified without the settlement
 * currency, e.g. "BTC/USDT" becomes "BTC/USDT:USDT", and notify the
 * user.
 */
export function sanitizeMarketSymbol(symbol: string, notify: (message: string) => void): string {
    const originalSymbol = symbol;
    symbol = completeMarketSymbol(symbol);
    if (originalSymbol !== symbol) {
        notify(`Inferred market symbol from '${originalSymbol}' to '${symbol}'`);
    }
    return symbol;
}
