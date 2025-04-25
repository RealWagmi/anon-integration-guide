import { Exchange, Balances } from 'ccxt';

/**
 * Return the balance of the user on the given exchange
 */
export async function getUserBalance(exchange: Exchange): Promise<Balances> {
    if (!exchange.has['fetchBalance']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching user balance.`);
    }
    const balanceData = await exchange.fetchBalance();
    return balanceData;
}
