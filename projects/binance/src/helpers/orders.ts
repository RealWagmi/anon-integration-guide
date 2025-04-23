import { Exchange } from 'ccxt';

export async function getUserOpenOrders(exchange: Exchange) {
    if (!exchange.has['fetchOpenOrders']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open orders.`);
    }
    exchange.options["warnOnFetchOpenOrdersWithoutSymbol"] = false;
    const orders = await exchange.fetchOpenOrders();
    return orders;
}
