import { MarketInterface, Ticker } from "ccxt";

/**
 * Format a ticker object into a string.
 */
export function formatMarketInfo(market: MarketInterface, ticker: Ticker) {
    const rows = [
        `Last price: ${ticker.last}`,
        `Bid price: ${ticker.bid}`,
        `Ask price: ${ticker.ask}`,
        `24h high: ${ticker.high}`,
        `24h low: ${ticker.low}`,
        `24h volume in ${market.quote}: ${ticker.quoteVolume}`,
        `24h volume in ${market.base}: ${ticker.baseVolume}`
    ];
    return rows.join('\n');
}