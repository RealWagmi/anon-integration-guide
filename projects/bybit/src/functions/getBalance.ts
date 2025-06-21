import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserBalance } from '../helpers/account';
import { formatBalances } from '../helpers/format';

interface Props {
    currency: string | null;
}

/**
 * Get the unified user balance on the exchange.
 *
 * @param props - The function input parameters
 * @param props.currency - Optionally, specify a currency to get balance just for that currency, e.g. "BTC"
 * @param options HeyAnon SDK options
 * @returns The balance for all currencies/tokens of the user
 */
export async function getBalance({ currency }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Fetch the unified user balance
        const balances = await getUserBalance(exchange);
        // If a currency is specified, return the balance for that currency
        if (currency) {
            const balance = balances[currency];
            if (typeof balance === 'undefined') {
                return toResult(`You have no balance for currency ${currency}`);
            }
            if (balance.used && balance.used > 0) {
                return toResult(`Your unified balance for currency ${currency} is ${balance.total}, of which ${balance.free} can be used to trade`);
            } else {
                return toResult(`Your unified balance for currency ${currency} is ${balance.total}`);
            }
        }
        // Return the balance for all currencies/tokens
        return toResult(`Your balance on ${exchange.name} platform:\n${formatBalances(balances, ' - ')}`);
    } catch (error) {
        return toResult(`Error getting balance: ${error}`, true);
    }
}
