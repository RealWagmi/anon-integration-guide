import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketObject, getMarketTickerBySymbol } from '../helpers/markets';
import { formatMarketInfo } from '../helpers/format';
import { getMarketsLeverageTiers } from '../helpers/leverage';

interface Props {
    market: string;
}

/**
 * Get information about a market, including price, volume data and max leverage.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market to get information for
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the market information returned by `formatMarketInfo`
 */
export async function getMarketInfo({ market }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Fetch market ticker
        const marketObject = await getMarketObject(exchange, market);
        const ticker = await getMarketTickerBySymbol(marketObject.symbol, exchange);
        if (!ticker) {
            return toResult('Could not find price info for market ' + marketObject.symbol, true);
        }
        // Fetch market leverage tiers (will return empty object for a spot market)
        const leverageTiers = await getMarketsLeverageTiers(exchange, [marketObject.symbol]);
        return toResult(formatMarketInfo(marketObject, ticker, leverageTiers));
    } catch (error) {
        return toResult(`${error}`, true);
    }
}
