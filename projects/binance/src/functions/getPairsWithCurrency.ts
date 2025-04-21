import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';

interface Props {
    currency: string;
}

/**
 * Get a list of all pair symbols that include a given currency.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.currency - The currency to get pairs for
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} The list of pair symbols or an error description
 */
export async function getPairsWithCurrency({ currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const markets = await exchange.loadMarkets();
    const symbols: string[] = [];
    Object.keys(markets).forEach((key) => {
        const market = markets[key];
        if (!market) return;
        if ([market.base.toLowerCase(), market.quote.toLowerCase()].includes(currency.toLowerCase())) {
            symbols.push(market.symbol);
        }
    });
    return toResult(symbols.join('\n'));
}
