import { Exchange } from 'ccxt';

/**
 * Get all open orders of the user on the given exchange
 *
 * @link https://docs.ccxt.com/#/README?id=understanding-the-orders-api-design
 */
export async function getUserOpenOrders(exchange: Exchange) {
    if (!exchange.has['fetchOpenOrders']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open orders.`);
    }
    exchange.options["warnOnFetchOpenOrdersWithoutSymbol"] = false;
    const orders = await exchange.fetchOpenOrders();
    return orders;
}

/**
 * Get a specific order by ID on the given exchange.
 *
 * A trading pair symbol argument is included because some exchanges
 * (including Binance) do not have univocal order IDs, so the symbol
 * is required to identify the order.
 *
 * @link https://docs.ccxt.com/#/README?id=understanding-the-orders-api-design
 */
export async function getOrderById(exchange: Exchange, id: string, symbol?: string) {
    const order = await exchange.fetchOrder(id, symbol);
    return order;
}
