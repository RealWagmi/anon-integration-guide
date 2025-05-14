import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketTickerBySymbol } from '../helpers/markets';
import { formatMarketInfo } from '../helpers/format';
interface Props {
    market: string;
}

/**
 * Get information about a market, including price and volume data.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market to get information for
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A string with the market information, namely:
 * - The last price
 * - The bid price
 * - The ask price
 * - The 24h volume
 * - The 24h high
 * - The 24h low
 */
export async function getMarketInfo({ market }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const markets = await exchange.loadMarkets();
    const marketObject = markets[market];
    if (!marketObject) {
        return toResult('No market found with symbol ' + market, true);
    }
    const ticker = await getMarketTickerBySymbol(market, exchange);
    if (!ticker) {
        return toResult('No info found on market ' + market, true);
    }
    return toResult(formatMarketInfo(marketObject, ticker));
}
