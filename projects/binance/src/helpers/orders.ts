import { Exchange, Order } from 'ccxt';
import { ORDER_TYPES } from '../constants';
import { getMarketLastPriceBySymbol } from './markets';

/**
 * Create an advanced order with support for various order types.
 *
 * @link https://docs.ccxt.com/#/README?id=placing-orders
 *
 * @param exchange CCXT exchange instance
 * @param symbol Trading pair symbol, e.g. "BTC/USDT"
 * @param type Order type: 'market', 'limit', 'trigger', 'stop_loss', 'take_profit', 'oco', 'trailing'
 * @param side Order side: 'buy' or 'sell'
 * @param amount Amount to trade
 * @param price Price for limit orders (required for limit orders)
 * @param options Additional options based on order type
 * @returns The created order
 */
export async function createOrder(
    exchange: Exchange,
    symbol: string,
    type: (typeof ORDER_TYPES)[number],
    side: string,
    amount: number,
    price: number | null,
    options: any = {},
): Promise<Order> {
    // Default params for all order types
    const params: any = {};

    let ccxtType = type; // Default, will be overridden for special order types

    // Handle different order types
    switch (type) {
        case 'market':
        case 'limit':
            // Standard order types, no special handling needed
            ccxtType = type;
            break;

        case 'trigger':
            // Trigger orders use the triggerPrice parameter
            if (!options.triggerPrice) {
                throw new Error('Trigger orders require a triggerPrice');
            }

            ccxtType = price ? 'limit' : 'market';
            params.triggerPrice = options.triggerPrice;

            if (exchange.id === 'binance') {
                // Trigger orders are not supported by Binance
                // @link https://developers.binance.com/docs/binance-spot-api-docs/enums#order-types-ordertypes-type
                // CCXT automatically converts them to STOP_LOSS orders
                // @link https://discord.com/channels/690203284119617602/690203284727660739/1367185601572376636
                // So, we need to manually check if the user wants a take profit order,
                // lest Binance return with error "Stop price would trigger immediately".
                // In other words, we are simulating what the UI does when you select
                // a "Stop limit" or a "Stop market" order from the dropdown menu.
                const lastPrice = await getMarketLastPriceBySymbol(symbol, exchange);
                if ((options.triggerPrice > lastPrice && side === 'sell') || (options.triggerPrice < lastPrice && side === 'buy')) {
                    // a take profit order is a trigger order with direction from below (sell) or above (buy)
                    ccxtType = 'take_profit';
                } else if ((options.triggerPrice > lastPrice && side === 'buy') || (options.triggerPrice < lastPrice && side === 'sell')) {
                    // a stop loss order is a trigger order with direction from above (sell) or below (buy)
                    ccxtType = 'stop_loss';
                }
                // Do not break here, we need to continue the switch so that
                // the take profit or stop loss order is processed correctly
            }

            break;

        case 'stop_loss':
            // Stop loss orders
            if (!options.triggerPrice) {
                throw new Error('Stop loss orders require a triggerPrice');
            }

            ccxtType = price ? 'limit' : 'market';
            params.stopLossPrice = options.triggerPrice;
            params.reduceOnly = options.reduceOnly !== false; // Default to true for stop loss
            break;

        case 'take_profit':
            // Take profit orders
            if (!options.triggerPrice) {
                throw new Error('Take profit orders require a triggerPrice');
            }

            ccxtType = price ? 'limit' : 'market';
            params.takeProfitPrice = options.triggerPrice;
            params.reduceOnly = options.reduceOnly !== false; // Default to true for take profit
            break;

        case 'oco':
            // One Cancels the Other orders (stop loss + take profit)
            if (!options.stopLoss || !options.takeProfit) {
                throw new Error('OCO orders require both stopLoss and takeProfit configurations');
            }

            ccxtType = price ? 'limit' : 'market';

            // Configure stop loss
            params.stopLoss = {
                triggerPrice: options.stopLoss.triggerPrice,
            };

            if (options.stopLoss.price) {
                params.stopLoss.price = options.stopLoss.price;
            }

            // Configure take profit
            params.takeProfit = {
                triggerPrice: options.takeProfit.triggerPrice,
            };

            if (options.takeProfit.price) {
                params.takeProfit.price = options.takeProfit.price;
            }
            break;

        case 'trailing':
            // Trailing stop orders
            if (options.trailingPercent === undefined && options.trailingAmount === undefined) {
                throw new Error('Trailing orders require either trailingPercent or trailingAmount');
            }

            ccxtType = price ? 'limit' : 'market';

            if (options.trailingPercent !== undefined) {
                params.trailingPercent = options.trailingPercent;
            }

            if (options.trailingAmount !== undefined) {
                params.trailingAmount = options.trailingAmount;
            }

            if (options.triggerPrice) {
                params.trailingTriggerPrice = options.triggerPrice;
            }
            break;

        default:
            throw new Error(`Unsupported order type: ${type}`);
    }

    if (ccxtType === 'limit' && price === null) {
        throw new Error('Limit orders require a price');
    }

    // Throw if any of the parameters is null or undefined
    for (const key in params) {
        if (params[key] === null || params[key] === undefined) {
            throw new Error(`createOrder: Parameter ${key} is null or undefined`);
        }
    }

    // Create the order with CCXT
    const order = await exchange.createOrder(symbol, ccxtType, side, amount, price === null ? undefined : price, params);
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
