import { Exchange, Balances, TransferEntry } from 'ccxt';
import { ACCOUNT_TYPES } from '../constants';

/**
 * Return the balance of the user on the given exchange
 * for the given account type
 */
export async function getUserBalance(exchange: Exchange, accountType: (typeof ACCOUNT_TYPES)[number]): Promise<Balances> {
    if (!exchange.has['fetchBalance']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching user balance.`);
    }
    const balanceData = await exchange.fetchBalance({ type: accountType });
    return balanceData;
}

interface TransferOptions {
    currency: string;
    amount: number;
    from: string;
    to: string;
}

/**
 * Transfer funds from an account (e.g. spot) to another account (e.g. future)
 * with the given exchange
 *
 * @link https://docs.ccxt.com/#/README?id=transfers
 */
export async function transfer(exchange: Exchange, options: TransferOptions): Promise<TransferEntry> {
    if (!exchange.has['transfer']) {
        throw new Error(`Transfer is not supported by exchange ${exchange.name}`);
    }

    const allowedAccounts = exchange.options['accountsByType'];
    if (!allowedAccounts[options.from]) {
        throw new Error(`Account with name '${options.from}' does not exist on ${exchange.name}.  Allowed accounts: ${Object.keys(allowedAccounts).join(', ')}.`);
    }

    if (!allowedAccounts[options.to]) {
        throw new Error(`Account with name '${options.to}' does not exist on ${exchange.name}.  Allowed accounts: ${Object.keys(allowedAccounts).join(', ')}.`);
    }

    return exchange.transfer(options.currency.toUpperCase(), options.amount, options.from, options.to);
}
