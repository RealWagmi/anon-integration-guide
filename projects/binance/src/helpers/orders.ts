import { Exchange, Order } from 'ccxt';
import { getMarketLastPriceBySymbol } from './markets';
import util from 'util';
/**
 * Create a simple order, that is, an order that has no triggers attached to it.
 */
export async function createSimpleOrder(exchange: Exchange, symbol: string, side: 'buy' | 'sell', amount: number, limitPrice?: number): Promise<Order> {
    // Warn the user if their limit price is useless
    if (limitPrice) {
        const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
        if (side === 'buy' && limitPrice > lastPrice) {
            throw new Error(`Current price ${lastPrice} is higher than your limit price ${limitPrice}, so the order will be filled immediately.  Use a market order instead.`);
        }
        if (side === 'sell' && limitPrice < lastPrice) {
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
 * Create an OCO (one-cancels-the-other) order using CCXT implicit API for Binance
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
): Promise<any> {
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

    const response = await (exchange as any).privatePostOrderListOco(args);
    console.log(util.inspect(response, { depth: null, colors: true }));
    return response;
}

// /**
//  * Create an advanced order with support for various order types.
//  *
//  * @link https://docs.ccxt.com/#/README?id=placing-orders
//  *
//  * @param exchange CCXT exchange instance
//  * @param symbol Trading pair symbol, e.g. "BTC/USDT"
//  * @param type Order type: 'market', 'limit', 'trigger', 'stop_loss', 'take_profit', 'oco', 'trailing'
//  * @param side Order side: 'buy' or 'sell'
//  * @param amount Amount to trade
//  * @param price Price for limit orders (required for limit orders)
//  * @param options Additional options based on order type
//  * @returns The created order
//  */
// export async function createOrder(
//     exchange: Exchange,
//     symbol: string,
//     type: (typeof ORDER_TYPES)[number],
//     side: string,
//     amount: number,
//     price: number | null,
//     options: any = {},
// ): Promise<Order> {
//     // Default params for all order types
//     const params: any = {};

//     let ccxtType = type; // Default, will be overridden for special order types

//     // Handle different order types
//     switch (type) {
//         case 'market':
//         case 'limit':
//             // Standard order types, no special handling needed
//             ccxtType = type;
//             break;

//         case 'trigger':
//             // Trigger orders use the triggerPrice parameter
//             if (!options.triggerPrice) {
//                 throw new Error('Trigger orders require a triggerPrice');
//             }

//             ccxtType = price ? 'limit' : 'market';

//             // params.reduceOnly = options.reduceOnly !== false; // Default to true for take profit

//             // TODO: A command like this:
//             // 'Send a sell order for 0.05 AAVE at 110 USDC when AAVE price goes below 180 USDC'
//             // if AAVE current price is already below 180 USDC, it should trigger immediately
//             // but with our logic it sets up a trigger for >=180 USDC, because we 180 USDC is larger
//             // than current price, so we classify the order as a take profit order.  We should get
//             // the triggerDirection as well from the command, so that at least we can stop the user
//             // with a message "The current price is already below 180 USDC, so the trigger price should be
//             // less than 180 USDC".

//             // Other case:
//             // Sell 0.05 AAVE at 200 USDC with a 10% stop loss
//             // Should:
//             // 1. If current price of AAVE is above 200 USDC, it should stop and warn the user
//             // 2. If current price is not
//             // 2. Otherwise, it should create a take profit order at 200 USDC and a market stop loss
//             // order at 180 USDC

//             // Trigger orders are not supported by Binance
//             // @link https://developers.binance.com/docs/binance-spot-api-docs/enums#order-types-ordertypes-type
//             // CCXT automatically converts them to STOP_LOSS orders
//             // @link https://discord.com/channels/690203284119617602/690203284727660739/1367185601572376636
//             // So, we need to manually check if the user wants a take profit order,
//             // lest Binance return with error "Stop price would trigger immediately".
//             // In other words, we are simulating what the UI does when you select
//             // a "Stop limit" or a "Stop market" order from the dropdown menu.
//             const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
//             if ((options.triggerPrice > lastPrice && side === 'sell') || (options.triggerPrice < lastPrice && side === 'buy')) {
//                 console.log('take profit order');
//                 // a take profit order is a trigger order with direction from below (sell) or above (buy)
//                 params.takeProfitPrice = options.triggerPrice;
//             } else if ((options.triggerPrice > lastPrice && side === 'buy') || (options.triggerPrice < lastPrice && side === 'sell')) {
//                 console.log('stop loss order');
//                 // a stop loss order is a trigger order with direction from above (sell) or below (buy)
//                 params.stopLossPrice = options.triggerPrice;
//             }
//             break;

//         case 'oco':
//             // One Cancels the Other orders (stop loss + take profit)
//             if (!options.ocoConfiguration.ocoStopLoss || !options.ocoConfiguration.ocoTakeProfit) {
//                 throw new Error('OCO orders require both stopLoss and takeProfit configurations');
//             }

//             ccxtType = price ? 'limit' : 'market';

//             // Configure stop loss
//             params.stopLoss = {
//                 triggerPrice: options.ocoConfiguration.ocoStopLoss.triggerPrice,
//             };

//             if (options.ocoConfiguration.ocoStopLoss.price) {
//                 params.stopLoss.price = options.ocoConfiguration.ocoStopLoss.price;
//             }

//             // Configure take profit
//             params.takeProfit = {
//                 triggerPrice: options.ocoConfiguration.ocoTakeProfit.triggerPrice,
//             };

//             if (options.ocoConfiguration.ocoTakeProfit.price) {
//                 params.takeProfit.price = options.ocoConfiguration.ocoTakeProfit.price;
//             }
//             break;

//         case 'trailing':
//             // Trailing stop orders
//             if (options.trailingPercent === undefined && options.trailingAmount === undefined) {
//                 throw new Error('Trailing orders require either trailingPercent or trailingAmount');
//             }

//             ccxtType = price ? 'limit' : 'market';

//             if (options.trailingPercent !== undefined) {
//                 params.trailingPercent = options.trailingPercent;
//             }

//             if (options.trailingAmount !== undefined) {
//                 params.trailingAmount = options.trailingAmount;
//             }

//             if (options.triggerPrice) {
//                 params.trailingTriggerPrice = options.triggerPrice;
//             }
//             break;

//         default:
//             throw new Error(`Unsupported order type: ${type}`);
//     }

//     if (ccxtType === 'limit' && price === null) {
//         throw new Error('Limit orders require a price');
//     }

//     // Throw if any of the parameters is null or undefined
//     for (const key in params) {
//         if (params[key] === null || params[key] === undefined) {
//             throw new Error(`createOrder: Parameter ${key} is null or undefined`);
//         }
//     }

//     // Create the order with CCXT
//     const order = await exchange.createOrder(symbol, ccxtType, side, amount, price === null ? undefined : price, params);
//     return order;
// }

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
