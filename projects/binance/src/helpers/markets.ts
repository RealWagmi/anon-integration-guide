import { Exchange, MarketInterface } from 'ccxt';

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
