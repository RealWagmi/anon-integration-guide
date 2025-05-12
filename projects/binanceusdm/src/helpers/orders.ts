import { Exchange, Order } from 'ccxt';
import { LIMIT_PRICE_TOLERANCE } from '../constants';
import { getMarketLastPriceBySymbol } from './markets';

/**
 * Create a simple order, that is, an order that has no triggers attached to it.
 */
export async function createSimpleOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    limitPrice?: number,
    params?: Record<string, any>,
): Promise<Order> {
    // Warn the user if their limit price is useless
    if (limitPrice) {
        const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
        if (side === 'buy' && limitPrice * (1 - LIMIT_PRICE_TOLERANCE) > lastPrice) {
            throw new Error(`Current price ${lastPrice} is higher than your limit price ${limitPrice}, so the order will be filled immediately.  Use a market order instead.`);
        }
        if (side === 'sell' && limitPrice * (1 + LIMIT_PRICE_TOLERANCE) < lastPrice) {
            throw new Error(`Current price ${lastPrice} is lower than your limit price ${limitPrice}, so the order will be filled immediately.  Use a market order instead.`);
        }
    }
    // Place the order
    const ccxtType = limitPrice ? 'limit' : 'market';
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice, params);
    return order;
}

/**
 * Get all open orders of the user on the given exchange
 *
 * @link https://docs.ccxt.com/#/README?id=understanding-the-orders-api-design
 */
export async function getUserOpenOrders(exchange: Exchange): Promise<Order[]> {
    if (!exchange.has['fetchOpenOrders']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open orders.`);
    }
    exchange.options['warnOnFetchOpenOrdersWithoutSymbol'] = false;
    const orders = await exchange.fetchOpenOrders();
    return orders;
}

/**
 * Get a specific order by ID on the given exchange.
 *
 * The trading pair symbol argument is required for some exchanges
 * (including Binance) that do not have univocal order IDs.
 *
 * @link https://docs.ccxt.com/#/README?id=understanding-the-orders-api-design
 */
export async function getOrderById(exchange: Exchange, id: string, symbol?: string): Promise<Order> {
    if (!exchange.has['fetchOrder']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching a single order.`);
    }
    const order = await exchange.fetchOrder(id, symbol);
    return order;
}

/**
 * Cancel a specific order by ID on the given exchange.
 *
 * The market symbol argument is required for some exchanges
 * (including Binance) that do not have univocal order IDs.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 */
export async function cancelOrderById(exchange: Exchange, id: string, symbol?: string): Promise<Order> {
    if (!exchange.has['cancelOrder']) {
        throw new Error(`Exchange ${exchange.name} does not support cancelling a single order.`);
    }
    const cancelledOrder = await exchange.cancelOrder(id, symbol);
    return cancelledOrder as Order;
}

/**
 * Cancel all open orders on the given exchange.
 *
 * The trading pair symbol argument is required for some exchanges
 * (including Binance) that do not have univocal order IDs.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 */
export async function cancelAllOrders(exchange: Exchange, symbol?: string): Promise<Order[]> {
    if (!exchange.has['cancelAllOrders']) {
        throw new Error(`Exchange ${exchange.name} does not support cancelling all orders.`);
    }
    const cancelledOrders = await exchange.cancelAllOrders(symbol);
    return cancelledOrders as Order[];
}

/**
 * Convert 'long' and 'short' to 'buy' and 'sell', for CCXT.
 *
 * Throws an error if the side is not 'long' or 'short'.
 */
export function longShortToBuySell(side: 'long' | 'short'): 'buy' | 'sell' {
    if (side === 'long') {
        return 'buy';
    }
    if (side === 'short') {
        return 'sell';
    }
    throw new Error(`Invalid side: ${side}`);
}

/**
 * Convert 'buy' and 'sell' to 'long' and 'short', for CCXT.
 *
 * Throws an error if the side is not 'buy' or 'sell'.
 */
export function buySellToLongShort(side: 'buy' | 'sell'): 'long' | 'short' {
    if (side === 'buy') {
        return 'long';
    }
    if (side === 'sell') {
        return 'short';
    }
    throw new Error(`Invalid side: ${side}`);
}
