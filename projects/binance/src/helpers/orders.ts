import { Exchange, Order } from 'ccxt';
import { getMarketLastPriceBySymbol } from './markets';
import { LIMIT_PRICE_TOLERANCE } from '../constants';

/**
 * Create a simple order, that is, an order that has no triggers attached to it.
 */
export async function createSimpleOrder(exchange: Exchange, symbol: string, side: 'buy' | 'sell', amount: number, limitPrice?: number): Promise<Order> {
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
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, limitPrice);
    return order;
}

/**
 * Create a trigger order, that is, an order that has a trigger price attached to it.
 */
export async function createTriggerOrder(exchange: Exchange, symbol: string, side: 'buy' | 'sell', amount: number, triggerPrice: number, limitPrice?: number): Promise<Order> {
    if (!exchange.features.spot.createOrder.triggerPrice) {
        throw new Error(`Exchange ${exchange.name} does not support trigger/conditional orders.`);
    }
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
 * Create a spot OCO order using CCXT implicit API for Binance
 *
 * An OCO order (one-cancels-the-other) contains a take profit and a stop loss
 * order for the same amount.
 *
 * @link https://d.pr/i/G72YL7 UI SCREENSHOT
 * @link https://gist.github.com/coccoinomane/efeb6e213e5d34ca66ebdc72b478a215
 * @link https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints#new-order-list---oco-trade
 *
 * @param {Exchange} exchange - The exchange object
 * @param {string} symbol - The symbol of the market
 * @param {'buy' | 'sell'} side - The side of the order
 * @param {number} amount - The amount of the order
 * @param {number} takeProfitTriggerPrice - The trigger price of the take profit order
 * @param {number} stopLossTriggerPrice - The trigger price of the stop loss order
 * @param {number} [takeProfitLimitPrice] - The limit price of the take profit order
 * @param {number} [stopLossLimitPrice] - The limit price of the stop loss order
 * @returns {[Order, Order]} - The two orders created
 */
export async function createBinanceOcoOrder(
    exchange: Exchange,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    takeProfitTriggerPrice: number,
    stopLossTriggerPrice: number,
    takeProfitLimitPrice?: number,
    stopLossLimitPrice?: number,
): Promise<[Order, Order]> {
    // Fetch market object
    const markets = await exchange.loadMarkets();
    const market = markets[symbol];
    if (!market) {
        throw new Error(`Market ${symbol} not found`);
    }

    // Determine parameters to send Binance
    const args: any = {
        symbol: market.id,
        side: side.toUpperCase(),
        quantity: exchange.amountToPrecision(symbol, amount),
        newOrderRespType: 'FULL',
    };

    if (side === 'sell') {
        // Above order is a take profit order
        args.aboveType = takeProfitLimitPrice ? 'TAKE_PROFIT_LIMIT' : 'TAKE_PROFIT';
        args.aboveStopPrice = exchange.priceToPrecision(symbol, takeProfitTriggerPrice);
        if (takeProfitLimitPrice) {
            args.abovePrice = exchange.priceToPrecision(symbol, takeProfitLimitPrice);
            args.aboveTimeInForce = 'GTC';
        }
        // Below order is a stop loss order
        args.belowType = stopLossLimitPrice ? 'STOP_LOSS_LIMIT' : 'STOP_LOSS';
        args.belowStopPrice = exchange.priceToPrecision(symbol, stopLossTriggerPrice);
        if (stopLossLimitPrice) {
            args.belowPrice = exchange.priceToPrecision(symbol, stopLossLimitPrice);
            args.belowTimeInForce = 'GTC';
        }
    } else {
        // Above order is a stop loss order
        args.aboveType = stopLossLimitPrice ? 'STOP_LOSS_LIMIT' : 'STOP_LOSS';
        args.aboveStopPrice = exchange.priceToPrecision(symbol, stopLossTriggerPrice);
        if (stopLossLimitPrice) {
            args.abovePrice = exchange.priceToPrecision(symbol, stopLossLimitPrice);
            args.aboveTimeInForce = 'GTC';
        }
        // Below order is a take profit order
        args.belowType = takeProfitLimitPrice ? 'TAKE_PROFIT_LIMIT' : 'TAKE_PROFIT';
        args.belowStopPrice = exchange.priceToPrecision(symbol, takeProfitTriggerPrice);
        if (takeProfitLimitPrice) {
            args.belowPrice = exchange.priceToPrecision(symbol, takeProfitLimitPrice);
            args.belowTimeInForce = 'GTC';
        }
    }
    // Send the request to Binance
    const response = await (exchange as any).privatePostOrderListOco(args);

    // Parse the response into two orders
    let orders: [Order | null, Order | null] = [null, null];
    try {
        const binanceOrders = response.orderReports;
        orders = binanceOrders.map((o: any) => exchange.parseOrder(o));
    } catch (error) {
        console.error(error);
        throw new Error(`createBinanceOcoOrder: Could not parse orders from Binance response.  Response: ${response}`);
    }

    return orders as [Order, Order];
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
 * The trading pair symbol argument is required for some exchanges
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
