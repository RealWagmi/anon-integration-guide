import { Exchange, Balances } from 'ccxt';
import { ACCOUNT_TYPES } from '../constants';

/**
 * Return the balance of the user on the given exchange
 * for the given account type
 */
export async function getUserBalance(exchange: Exchange, accountType?: (typeof ACCOUNT_TYPES)[number]): Promise<Balances> {
    if (!exchange.has['fetchBalance']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching user balance.`);
    }
    const balanceData = await exchange.fetchBalance({ type: accountType });
    return balanceData;
}
