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
    const ticker = await exchange.fetchTicker(symbol);
    return ticker;
}
