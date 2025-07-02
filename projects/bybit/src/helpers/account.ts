import { Exchange, Balances, DepositAddress } from 'ccxt';
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

/**
 * Get the user deposit address for a given currency and network.
 *
 * The returned object has the following properties:
 * - address: the deposit address
 * - currency: the currency
 * - network: the network
 * - tag: the tag (if any)
 * - info: the raw response from the exchange
 */
export async function getUserDepositAddress(exchange: Exchange, currency: string, network: string): Promise<DepositAddress> {
    if (!exchange.has['fetchDepositAddress']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching user deposit addresses.`);
    }
    const depositAddress = await exchange.fetchDepositAddress(currency, { network });
    return depositAddress;
}
