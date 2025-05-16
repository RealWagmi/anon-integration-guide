import { Exchange, MarketInterface, Ticker } from 'ccxt';

/**
 * Given an exchange and a currency, get a list of all its active markets
 * for the given currency.
 */
export async function getMarketsWithCurrency(currency: string, exchange: Exchange): Promise<MarketInterface[]> {
    const allMarkets = await exchange.loadMarkets();
    const markets: MarketInterface[] = [];
    Object.keys(allMarkets).forEach((key) => {
        const market = allMarkets[key];
        if (!market) return;
        if (!market.active) return;
        if ([market.base.toLowerCase(), market.quote.toLowerCase()].includes(currency.toLowerCase())) {
            markets.push(market);
        }
    });
    return markets;
}

/**
 * Given an exchange and a market symbol, return the ticker for the market.
 *
 * The ticker contains price information for the market:
 * {
 *   'symbol':        string symbol of the market ('BTC/USD', 'ETH/BTC', ...)
 *   'info':        { the original non-modified unparsed reply from exchange API },
 *   'timestamp':     int (64-bit Unix Timestamp in milliseconds since Epoch 1 Jan 1970)
 *   'datetime':      ISO8601 datetime string with milliseconds
 *   'high':          float, // highest price
 *   'low':           float, // lowest price
 *   'bid':           float, // current best bid (buy) price
 *   'bidVolume':     float, // current best bid (buy) amount (may be missing or undefined)
 *   'ask':           float, // current best ask (sell) price
 *   'askVolume':     float, // current best ask (sell) amount (may be missing or undefined)
 *   'vwap':          float, // volume weighed average price
 *   'open':          float, // opening price
 *   'close':         float, // price of last trade (closing price for current period)
 *   'last':          float, // same as `close`, duplicated for convenience
 *   'previousClose': float, // closing price for the previous period
 *   'change':        float, // absolute change, `last - open`
 *   'percentage':    float, // relative change, `(change/open) * 100`
 *   'average':       float, // average price, `(last + open) / 2`
 *   'baseVolume':    float, // volume of base currency traded for last 24 hours
 *   'quoteVolume':   float, // volume of quote currency traded for last 24 hours
 * }
 * All prices in ticker structure are in quote currency.
 * @link https://docs.ccxt.com/#/?id=ticker-structure
 */
export async function getMarketTickerBySymbol(symbol: string, exchange: Exchange): Promise<Ticker> {
    if (!exchange.has['fetchTicker']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching price information`);
    }
    const ticker = await exchange.fetchTicker(symbol);
    return ticker;
}

/**
 * Given a market symbol and an exchange, return the last price for that market.
 *
 * The last price is the price of the last trade for the market.
 */
export async function getMarketLastPriceBySymbol(symbol: string, exchange: Exchange): Promise<number> {
    const ticker = await getMarketTickerBySymbol(symbol, exchange);
    if (!ticker.last) {
        throw new Error(`No last price found for symbol ${symbol}`);
    }
    return ticker.last;
}

/**
 * Given a market object, return the type of market, preferring the term
 * "perpetual" for swap markets and "delivery" for future markets
 * with an expiry date.
 *
 * @link https://docs.ccxt.com/#/?id=contract-naming-conventions
 */
export function getMarketType(market: MarketInterface) {
    if (market.type === 'swap') {
        return 'perpetual';
    }
    if (market.type === 'future' && market.expiryDatetime) {
        return 'delivery';
    }
    return market.type;
}

/**
 * Complete a partial market symbol with the settle currency.  For example,
 * "BTC/USDT" becomes "BTC/USDT:USDT", "ETH/BTC" becomes "ETH/BTC:BTC"
 *
 * If the market symbol is fully specified, e.g. "BTC/USDT:USDT",
 * return it unchanged.
 */
export function completeMarketSymbol(symbol: string): string {
    if (symbol.includes(':')) {
        return symbol;
    }
    const quote = symbol.split('/')[1];
    return `${symbol}:${quote}`;
}

/**
 * Given an exchange and a market (trading pair) symbol, return the
 * market object.
 *
 * @throws {Error} If the market is not found on the exchange.
 */
export async function getMarketObject(exchange: Exchange, symbol: string): Promise<MarketInterface> {
    const markets = await exchange.loadMarkets();
    const marketObject = markets[symbol];
    if (!marketObject) {
        throw new Error(`Exchange ${exchange.name} does not have market '${symbol}'`);
    }
    return marketObject;
}

/**
 * Given a market object, return the expiry date time object
 * for the market.
 *
 * If the market is not a future market, return null.
 *
 * @link https://docs.ccxt.com/#/?id=market-types
 */
export function getMarketExpiry(market: MarketInterface): Date | null {
    if (market.type === 'future') {
        return market.expiryDatetime ? new Date(market.expiryDatetime) : null;
    }
    return null;
}
