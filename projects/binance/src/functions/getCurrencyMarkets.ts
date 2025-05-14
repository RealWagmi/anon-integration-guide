import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketsWithCurrency } from '../helpers/markets';

interface Props {
    currency: string;
}

/**
 * Get a list of all active markets that include a given currency.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.currency - The currency to get markets for
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} The list of market symbols or an error description
 */
export async function getCurrencyMarkets({ currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const markets = await getMarketsWithCurrency(currency, exchange);
    if (markets.length === 0) {
        return toResult('No spot markets found for currency ' + currency); // not an error, just a message
    }
    const spotMarkets = markets.filter((market) => market.type === 'spot');
    return toResult(`Found ${spotMarkets.length} spot markets for currency ${currency}:\n\n${spotMarkets.map((market) => `${market.symbol}`).join('\n')}`);
}
