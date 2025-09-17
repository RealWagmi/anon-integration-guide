import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserBalance } from '../helpers/account';
import { formatBalances } from '../helpers/format';

interface Props {
    currency: string | null;
    account: 'funding' | 'trading' | null;
}

/**
 * Get the user balance, for either the funding account or the unified trading account (UTA).
 *
 * @param props - The function input parameters
 * @param props.currency - Optionally, specify a currency to get balance just for that currency, e.g. "BTC"
 * @param props.account - Optionally, specify the account to get balance for; defaults to "trading"
 * @param options HeyAnon SDK options
 * @returns The balance for all currencies/tokens of the user
 */
export async function getBalance({ currency, account }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Parse the account type
        if (account && account !== 'funding' && account !== 'trading') {
            return toResult(`Invalid account type, must be either "funding" or "trading"`, true);
        }
        let ccxtAccount: 'funding' | 'unified' = 'unified';
        let accountLabel = 'unified trading account (UTA)';
        if (account === 'funding') {
            ccxtAccount = 'funding';
            accountLabel = 'funding account';
        }
        // Fetch the user balance
        const balances = await getUserBalance(exchange, ccxtAccount);
        // If a currency is specified, return the balance for that currency
        if (currency) {
            const balance = balances[currency];
            if (typeof balance === 'undefined') {
                return toResult(`You have no balance for currency ${currency}`);
            }
            if (balance.used && balance.used > 0) {
                return toResult(`Your ${accountLabel} balance for currency ${currency} is ${balance.total}, of which ${balance.free} are free and can be used`);
            } else {
                return toResult(`Your ${accountLabel} balance for currency ${currency} is ${balance.total}`);
            }
        }
        // Return the balance for all currencies/tokens
        return toResult(`Your ${accountLabel} balance on ${exchange.name}:\n${formatBalances(balances, ' - ')}`);
    } catch (error) {
        return toResult(`Error getting balance: ${error}`, true);
    }
}
