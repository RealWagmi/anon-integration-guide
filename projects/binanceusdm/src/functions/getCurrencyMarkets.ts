import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketExpiry, getMarketsWithCurrency, getMarketType } from '../helpers/markets';
import { getMarketsLeverageTiers } from '../helpers/leverage';
import { LeverageTier, MarketInterface } from 'ccxt';
import { MAX_MARKETS_IN_RESULTS } from '../constants';
import { formatDate } from '../helpers/format';

interface Props {
    currency: string;
}

/**
 * Get a list of all active markets that include a given currency.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.currency - The currency to get markets for
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} The list of markets with a short description, or an error description
 */
export async function getCurrencyMarkets({ currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const markets = await getMarketsWithCurrency(currency, exchange);
    if (markets.length === 0) {
        return toResult(`No markets found for currency ${currency}`); // not an error, just a message
    }

    const firstNMarkets = markets.slice(0, MAX_MARKETS_IN_RESULTS);
    const leverageTiers = await getMarketsLeverageTiers(
        firstNMarkets.map((m) => m.symbol),
        exchange,
    );

    const rows = [
        `Found ${markets.length} markets for ${currency} ${markets.length > MAX_MARKETS_IN_RESULTS ? `(showing first ${MAX_MARKETS_IN_RESULTS})` : ''}:`,
        ...firstNMarkets.map((market) => formatMarketLine(market, leverageTiers[market.symbol])),
    ];
    return toResult(rows.join('\n'));
}

function formatMarketLine(market: MarketInterface, leverageTiers: LeverageTier[]) {
    if (market.type === 'future') {
        return ` - ${market.base}/${market.quote} ${getMarketType(market)} market settled in ${market.settle} with expiry ${formatDate(getMarketExpiry(market))} and max leverage ${leverageTiers[0].maxLeverage}x (symbol: ${market.symbol})`;
    }
    return ` - ${market.base}/${market.quote} ${getMarketType(market)} market settled in ${market.settle} with max leverage ${leverageTiers[0].maxLeverage}x (symbol: ${market.symbol})`;
}
