import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserBalance } from '../helpers/account';
import { formatBalances } from '../helpers/format';

interface Props {
    currency?: string;
}

/**
 * Get the user balance on the exchange.
 *
 * @param {Object} props - The function input parameters
 * @param {string|undefined} props.currency - Optionally, specify a currency to get balance just for that currency, e.g. "BTC"
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} The balance for all currencies/tokens of the user
 */
export async function getBalance({ currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const balances = await getUserBalance(exchange);
    if (currency) {
        const balance = balances[currency];
        if (typeof balance === 'undefined') {
            return toResult(`Could not find currency '${currency}', make sure it is supported by the exchange.`, true);
        }
        if (balance.used && balance.used > 0) {
            return toResult(`Your balance for currency ${currency} is ${balance.total}, of which ${balance.free} can be used to trade`);
        } else {
            return toResult(`Your balance for currency ${currency} is ${balance.total}`);
        }
    }
    return toResult(`Here is your balance for all tokens:\n${formatBalances(balances, ' - ')}`);
}
