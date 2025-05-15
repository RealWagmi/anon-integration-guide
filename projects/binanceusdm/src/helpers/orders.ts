import { Exchange, Order } from 'ccxt';
import { LIMIT_PRICE_TOLERANCE, MAX_TRAILING_PERCENT, MIN_TRAILING_PERCENT, SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS } from '../constants';
import { getMarketLastPriceBySymbol, getMarketObject } from './markets';

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
 * Create a trigger order, that is, an order that has a trigger price attached to it.
 */
export async function createTriggerOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    triggerPrice: number,
    limitPrice?: number,
    params?: Record<string, any>,
): Promise<Order> {
    // Exchange specific checks
    const marketObject = await getMarketObject(exchange, symbol);
    if (!exchange.features[marketObject.type].linear.createOrder.triggerPrice) {
        throw new Error(`Trigger/conditional orders not supported on exchange ${exchange.name}`);
    }
    if (params?.reduceOnly === true && !exchange.has['createReduceOnlyOrder']) {
        throw new Error(`Reduce-only orders not supported on exchange ${exchange.name}`);
    }
    // Determine whether the order is take profit or stop loss
    const ccxtParams: any = {};
    const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
    if ((triggerPrice > lastPrice && side === 'sell') || (triggerPrice < lastPrice && side === 'buy')) {
        // a take profit order is a trigger order with direction from below (sell) or above (buy)
        ccxtParams.takeProfitPrice = triggerPrice;
    } else if ((triggerPrice > lastPrice && side === 'buy') || (triggerPrice < lastPrice && side === 'sell')) {
        // a stop loss order is a trigger order with direction from above (sell) or below (buy)
        ccxtParams.stopLossPrice = triggerPrice;
    }
    const ccxtType = limitPrice ? 'limit' : 'market';
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice, { ...params, ...ccxtParams });
    return order;
}

/**
 * Create a trailing stop order, that is, an order that triggers only
 * when the price moves in a certain direction by a certain percentage.
 *
 * On binance, these are the constraints for the order:
 * TRAILING_STOP_MARKET:
 * - BUY: the lowest price after order placed <= activationPrice, and the latest price >= the lowest price * (1 + callbackRate)
 * - SELL: the highest price after order placed >= activationPrice, and the latest price <= the highest price * (1 - callbackRate)
 * For TRAILING_STOP_MARKET, if you got such error code.
 * {"code": -2021, "msg": "Order would immediately trigger."}
 * means that the parameters you send do not meet the following requirements:
 * - BUY: activationPrice should be smaller than latest price.
 * - SELL: activationPrice should be larger than latest price.
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api BINANCE
 * @link https://d.pr/i/lsKnbt UI SCREENSHOT
 * @link https://docs.ccxt.com/#/README?id=trailing-orders CCXT DOCS
 */
export async function createTrailingStopOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    trailingPercentAsInteger: number,
    limitPrice?: number,
    triggerPrice?: number,
    params?: Record<string, any>,
): Promise<Order> {
    // Exchange specific checks
    const marketObject = await getMarketObject(exchange, symbol);
    if (!exchange.features[marketObject.type].linear.createOrder.trailing) {
        throw new Error(`Trailing stop orders not supported on exchange ${exchange.name}`);
    }
    if (params?.reduceOnly === true && !exchange.has['createReduceOnlyOrder']) {
        throw new Error(`Reduce-only orders not supported on exchange ${exchange.name}`);
    }
    if (limitPrice && !SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS) {
        throw new Error(`Limit price for trailing stop orders not supported on exchange ${exchange.name}`);
    }
    if (trailingPercentAsInteger < MIN_TRAILING_PERCENT || trailingPercentAsInteger > MAX_TRAILING_PERCENT) {
        throw new Error(`Trailing stop percentage must be a number between ${MIN_TRAILING_PERCENT}% and ${MAX_TRAILING_PERCENT}%.  You provided ${trailingPercentAsInteger}%.`);
    }
    // Determine whether the order is take profit or stop loss
    const ccxtParams: any = {
        trailingPercent: trailingPercentAsInteger,
        trailingTriggerPrice: triggerPrice,
    };
    // const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
    // if ((triggerPrice > lastPrice && side === 'sell') || (triggerPrice < lastPrice && side === 'buy')) {
    //     // a take profit order is a trigger order with direction from below (sell) or above (buy)
    //     ccxtParams.takeProfitPrice = triggerPrice;
    // } else if ((triggerPrice > lastPrice && side === 'buy') || (triggerPrice < lastPrice && side === 'sell')) {
    //     // a stop loss order is a trigger order with direction from above (sell) or below (buy)
    //     ccxtParams.stopLossPrice = triggerPrice;
    // }
    const ccxtType = limitPrice ? 'limit' : 'market';
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice, { ...params, ...ccxtParams });
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
