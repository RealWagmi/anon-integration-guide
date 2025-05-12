import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { completeMarketSymbol, getMarketTickerBySymbol } from '../helpers/markets';
import { formatMarketInfo } from '../helpers/format';
import { getMarketsLeverageTiers } from '../helpers/leverage';

interface Props {
    market: string;
}

/**
 * Get information about a market, including price and volume data.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market to get information for
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the market information returned by `formatMarketInfo`
 */
export async function getMarketInfo({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Infer market symbol from partial symbol
    const originalMarket = market;
    market = completeMarketSymbol(market);
    if (originalMarket !== market) {
        notify(`Inferred market symbol from '${originalMarket}' to '${market}'`);
    }
    // Fetch market object
    const markets = await exchange.loadMarkets();
    const marketObject = markets[completeMarketSymbol(market)];
    if (!marketObject) {
        return toResult(`No market found with symbol '${market}'.  Ask "Show me markets for token <your token>" and try again with full market symbol`, true);
    }
    // Fetch market ticker
    const ticker = await getMarketTickerBySymbol(market, exchange);
    if (!ticker) {
        return toResult('No info found on market ' + market, true);
    }
    // Fetch market leverage tiers
    const leverageTiers = await getMarketsLeverageTiers([market], exchange);
    if (!leverageTiers) {
        return toResult('No leverage info found for market ' + market, true);
    }
    return toResult(formatMarketInfo(marketObject, ticker, leverageTiers));
}
