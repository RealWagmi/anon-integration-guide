import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserBalance } from '../helpers/account';
import { formatBalances } from '../helpers/format';
import { ACCOUNT_TYPES } from '../constants';

interface Props {
    type: (typeof ACCOUNT_TYPES)[number] | null;
    currency: string | null;
}

/**
 * Get the user balance on the exchange.
 *
 * @param {Object} props - The function input parameters
 * @param {string|null} props.currency - Optionally, specify a currency to get balance just for that currency, e.g. "BTC"
 * @param {string|null} props.type - Optionally, specify an account type to get balance just for that account type.  Defaults to "future".
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} The balance for all currencies/tokens of the user
 */
export async function getBalance({ currency, type }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // If no type is specified, default to "future"
    if (type === null) {
        type = 'future';
    }
    // This is the futures integration, so we can't get spot balance
    if (type !== 'future') {
        return toResult(`This is the futures integration (@binanceusdm).  To get the ${type} balance, please use the Binance Spot integration (@binance)`, true);
    }
    // Fetch the balance for the given account type
    const balances = await getUserBalance(exchange, type);
    // If a currency is specified, return the balance for that currency
    if (currency) {
        const balance = balances[currency];
        if (typeof balance === 'undefined') {
            return toResult(`Could not find currency '${currency}', make sure it is supported by the exchange.`, true);
        }
        if (balance.used && balance.used > 0) {
            return toResult(`Your futures balance for currency ${currency} is ${balance.total}, of which ${balance.free} can be used to trade`);
        } else {
            return toResult(`Your futures balance for currency ${currency} is ${balance.total}`);
        }
    }
    // Return the balance for all currencies/tokens
    return toResult(`Here is your futures balance for all currencies:\n${formatBalances(balances, ' - ')}`);
}
