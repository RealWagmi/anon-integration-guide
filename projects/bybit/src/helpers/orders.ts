import { Exchange, Order } from 'ccxt';
import { getMarketLastPriceBySymbol, getMarketObject } from './markets';
import { LIMIT_PRICE_TOLERANCE } from '../constants';

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
 * Create a conditional order, that is, an order that has a trigger price
 * attached to it and does not utilize your balance until triggered.
 *
 * @link https://docs.ccxt.com/#/README?id=conditional-orders
 */
export async function createConditionalOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    triggerPrice: number,
    triggerDirection?: 'above' | 'below',
    limitPrice?: number,
): Promise<Order> {
    const ccxtParams: any = {};
    ccxtParams.triggerPrice = triggerPrice;
    if (triggerDirection) {
        ccxtParams.triggerDirection = triggerDirection;
    }
    const ccxtType = limitPrice ? 'limit' : 'market';
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice, ccxtParams);
    return order;
}

/**
 * Create a take profit or stop loss order, based on a price trigger.
 *
 * If the trigger price is above the current market price, it will be a take profit order.
 * If the trigger price is below the current market price, it will be a stop loss order.
 */
export async function createTakeProfitOrStopLossOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    triggerPrice: number,
    limitPrice?: number,
): Promise<Order> {
    const ccxtParams: any = {};
    const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
    // Determine whether the order is take profit or stop loss
    if ((triggerPrice > lastPrice && side === 'sell') || (triggerPrice < lastPrice && side === 'buy')) {
        // a take profit order is a trigger order with direction from below (sell) or above (buy)
        ccxtParams.takeProfitPrice = triggerPrice;
    } else if ((triggerPrice > lastPrice && side === 'buy') || (triggerPrice < lastPrice && side === 'sell')) {
        // a stop loss order is a trigger order with direction from above (sell) or below (buy)
        ccxtParams.stopLossPrice = triggerPrice;
    }
    const ccxtType = limitPrice ? 'limit' : 'market';
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice, ccxtParams);
    return order;
}

/**
 * Create a position with take profit and/or stop loss orders attached to it.
 *
 * @link https://docs.ccxt.com/#/README?id=stoploss-and-takeprofit-orders-attached-to-a-position
 */
export async function createPositionWithTakeProfitAndOrStopLossOrderAttached(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    takeProfitPrice: number | null,
    stopLossPrice: number | null,
    limitPrice?: number,
    params?: Record<string, any>,
): Promise<Order> {
    // Cannot create a position on spot markets
    const marketObject = await getMarketObject(exchange, symbol);
    if (marketObject.type === 'spot') {
        throw new Error(`Cannot create positions in spot markets`);
    }
    // Make sure that at least one of the stop loss or take profit prices is provided
    if (!takeProfitPrice && !stopLossPrice) {
        throw new Error('At least one of the stop loss or take profit prices must be provided');
    }
    // Check if exchange supports creating a position with TP/SL orders attached to it
    // We are permissive, that is, we throw an error only if the CCXT exchange explicitly
    // says that it does not support it.
    let supported: boolean = true;
    const features = exchange.features[marketObject.type];
    switch (marketObject.type) {
        case 'swap':
        case 'future':
        case 'option':
            switch (marketObject.subType) {
                case 'linear':
                    if (typeof features.linear.createOrder.attachedStopLossTakeProfit.triggerPriceType === 'undefined') {
                        supported = false;
                    }
                    break;
                case 'inverse':
                    if (typeof features.inverse.createOrder.attachedStopLossTakeProfit.triggerPriceType === 'undefined') {
                        supported = false;
                    }
                    break;
            }
            break;
    }
    if (!supported) {
        throw new Error(`Creating a TP/SL position not supported on this market type`);
    }
    // Create the order
    const ccxtParams: any = {};
    if (takeProfitPrice) {
        ccxtParams.takeProfit = {
            triggerPrice: takeProfitPrice,
        };
    }
    if (stopLossPrice) {
        ccxtParams.stopLoss = {
            triggerPrice: stopLossPrice,
        };
    }
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
 * @throws {OrderNotFound} If the order does not exist
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
 * Convert a mixed side parameter (that is, a side parameter that
 * can be any of 'long', 'short', 'buy', 'sell') to a CCXT side,
 * which is either 'buy' or 'sell'.
 */
export function toCcxtSide(side: 'long' | 'short' | 'buy' | 'sell'): 'buy' | 'sell' {
    switch (side) {
        case 'long':
        case 'buy':
            return 'buy';
        case 'short':
        case 'sell':
            return 'sell';
        default:
            throw new Error(`Invalid side: ${side}`);
    }
}
