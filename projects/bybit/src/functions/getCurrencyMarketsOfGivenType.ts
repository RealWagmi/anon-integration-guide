import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { fromCcxtMarketToMarketType, getMarketExpiry, getMarketsWithCurrencyAndType, toCcxtMarketType } from '../helpers/markets';
import { getMarketsLeverageTiers } from '../helpers/leverage';
import { LeverageTier, LeverageTiers, MarketInterface } from 'ccxt';
import { MARKET_TYPES, MAX_MARKETS_IN_RESULTS } from '../constants';
import { formatDate } from '../helpers/format';
import { SUPPORTED_MARKET_TYPES } from '../helpers/exchange';

interface Props {
    marketType: (typeof MARKET_TYPES)[number];
    currency: string;
}

/**
 * Get a list of all active markets that include a given currency, for the given market type.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.marketType - The market type to get markets for, e.g. 'spot' or 'perpetual'
 * @param {string} props.currency - The currency to get markets for
 * @param {FunctionOptions} options HeyAnon SDK optionsyp
 * @returns {Promise<FunctionReturn>} The list of markets with a short description, or an error description
 */
export async function getCurrencyMarketsOfGivenType({ marketType, currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    if (!SUPPORTED_MARKET_TYPES.includes(marketType as (typeof SUPPORTED_MARKET_TYPES)[number])) {
        return toResult(`We do not support market type '${marketType}'`);
    }
    try {
        const ccxtMarketType = toCcxtMarketType(marketType);
        const markets = await getMarketsWithCurrencyAndType(currency, ccxtMarketType, exchange);
        if (markets.length === 0) {
            return toResult(`No markets found for currency ${currency}`); // not an error, just a message
        }

        const firstNMarkets = markets.slice(0, MAX_MARKETS_IN_RESULTS);
        let leverageTiers: LeverageTiers;
        try {
            leverageTiers = await getMarketsLeverageTiers(
                exchange,
                firstNMarkets.map((m) => m.symbol),
            );
        } catch (error) {
            leverageTiers = {};
        }

        const rows = [
            `Found ${markets.length} markets for ${currency} ${markets.length > MAX_MARKETS_IN_RESULTS ? `(showing first ${MAX_MARKETS_IN_RESULTS})` : ''}:`,
            ...firstNMarkets.map((market) => formatMarketLine(market, leverageTiers[market.symbol])),
        ];
        return toResult(rows.join('\n'));
    } catch (error) {
        return toResult(`Error getting currency markets: ${error}`, true);
    }
}

/**
 * Format a market object (with no ticker data) for display in console as
 * a single line.
 */
function formatMarketLine(market: MarketInterface, leverageTiers?: LeverageTier[]) {
    let output = ` - ${market.base}/${market.quote} ${fromCcxtMarketToMarketType(market)}`;
    if (market.settle) {
        output += ` settled in ${market.settle}`;
    }
    if (market.type === 'future') {
        output += ` with expiry ${formatDate(getMarketExpiry(market))}`;
    }
    if (leverageTiers) {
        output += ` with max leverage ${leverageTiers[0].maxLeverage}x`;
    }
    output += ` (symbol: ${market.symbol})`;
    return output;
}
