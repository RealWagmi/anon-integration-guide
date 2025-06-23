// ---------------------------------------------------------------
// EXCHANGE SPECIFIC CONSTANTS AND FUNCTIONS
// ---------------------------------------------------------------
// Anything specific to the exchange that is not covered by CCXT.
// ---------------------------------------------------------------

import { bybit, Exchange, MarketInterface, Order, OrderNotFound, Position } from 'ccxt';
import { MARGIN_MODES as HEYANON_MARGIN_MODES } from '../constants';
import { toCcxtMarketType } from './markets';

export interface AddOrReducePositionMarginResult {
    liqPrice: string;
    riskId: string;
    positionStatus: string;
    positionIM: string;
    positionMM: string;
}

/**
 * The name of the exchange in CCXT, all lowercase.
 */
export const EXCHANGE_NAME = 'bybit';

/**
 * Margin modes supported by Bybit
 *
 * More details: https://www.bybit.com/en/help-center/article/Differences-Between-the-Margin-Modes-Under-the-Unified-Trading-Account
 */
export const EXCHANGE_MARGIN_MODES = ['ISOLATED_MARGIN', 'REGULAR_MARGIN', 'PORTFOLIO_MARGIN'] as const;

/**
 * Whether the exchange supports limit price for trailing stop orders
 */
export const EXCHANGE_SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS = false;

/**
 * Whether the exchange supports setting margin mode at the market level
 *
 * Bybit only has account-level margin mode (https://bybit-exchange.github.io/docs/v5/position/cross-isolate)
 */
export const EXCHANGE_SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL = false;

/**
 * Minimum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const EXCHANGE_MIN_TRAILING_PERCENT = 0.1;

/**
 * Maximum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const EXCHANGE_MAX_TRAILING_PERCENT = 10;

/**
 * Settlement currencies supported by this HeyAnon integration.  We need to
 * specify them here because Bybit endpoint to query the user's position requires
 * the settleCoin parameter (https://bybit-exchange.github.io/docs/v5/position).
 *
 * Please note that Bybit also supports inverse markets (e.g. BTC/USD:BTC)
 * but we have not tested them yet with this integration.
 */
export const SUPPORTED_SETTLE_CURRENCIES = ['USDT', 'USDC'] as const;

/**
 * Market types supported by this HeyAnon integration
 */
export const SUPPORTED_MARKET_TYPES = ['spot', 'perpetual', 'delivery'] as const;

/**
 * Given a CCXT position, return the initial margin (IM) as shown in the BybitUI
 *
 * Screenshot from the Bybit UI: https://d.pr/i/1SYmN2
 */
export function getUiInitialMargin(ccxtPosition: Position): number | undefined {
    let initialMargin: number | undefined = undefined;
    if (ccxtPosition.marginMode === 'isolated') {
        initialMargin = ccxtPosition?.info?.positionBalance;
    } else if (ccxtPosition.marginMode === 'cross') {
        initialMargin = ccxtPosition?.info?.positionIM;
    }
    return initialMargin;
}

/**
 * Get the margin mode set at the account level
 */
export async function getAccountMarginMode(exchange: Exchange): Promise<(typeof HEYANON_MARGIN_MODES)[number] | undefined> {
    // Get margin mode from the API
    const accountInfo = await (exchange as bybit).privateGetV5AccountInfo();
    if (!accountInfo?.result?.marginMode) {
        throw new Error('Could not get account margin mode');
    }
    // Convert exchange-specific margin mode to the HeyAnon one
    switch (accountInfo.result.marginMode) {
        case 'ISOLATED_MARGIN':
            return 'isolated';
        case 'REGULAR_MARGIN':
            return 'cross';
        case 'PORTFOLIO_MARGIN':
            return 'portfolio';
    }
    throw new Error(`Unknown margin mode: ${accountInfo.result.marginMode}`);
}

/**
 * Add margin to an existing position; will throw an error if the account
 * margin mode is not isolated.
 *
 * @link https://bybit-exchange.github.io/docs/v5/position/manual-add-margin
 *
 * @param exchange - The exchange object
 * @param marketObject - The market object
 * @param amount - The amount of margin to add, can be a positive or negative number
 * @param category - The category of the position (linear or inverse)
 * @param positionIdx - Required only for hedge mode position: 0: One-Way Mode, 1: Buy side of both side mode, 2: Sell side of both side mode
 * @returns The risk data about the position, including the new liquidation price and the new margin
 */
export async function addOrReducePositionMargin(
    exchange: Exchange,
    marketObject: MarketInterface,
    amount: number,
    category: 'linear' | 'inverse' = 'linear',
    positionIdx: 0 | 1 | 2 = 0,
): Promise<AddOrReducePositionMarginResult> {
    const params = {
        category,
        symbol: marketObject.id,
        margin: amount.toString(),
        positionIdx: positionIdx.toString(),
    };
    const response = await (exchange as bybit).privatePostV5PositionAddMargin(params);
    if (response.retMsg !== 'OK') {
        throw new Error(`Could not add margin to position: ${response.retMsg}`);
    }
    const result: AddOrReducePositionMarginResult = {
        liqPrice: response.result.liqPrice,
        riskId: response.result.riskId,
        positionStatus: response.result.positionStatus,
        positionIM: response.result.positionIM,
        positionMM: response.result.positionMM,
    };
    return result;
}

/**
 * Attach take profit and/or stop loss orders to an existing position,
 * using the /v5/position/trading-stop endpoint of the Bybit API.
 *
 * @throws {Error} If something goes wrong
 * @link https://bybit-exchange.github.io/docs/v5/position/trading-stop
 */
export async function attachTakeProfitAndOrStopLossOrderToExistingPosition(
    exchange: Exchange,
    marketObject: MarketInterface,
    takeProfitPrice: number | null,
    stopLossPrice: number | null,
): Promise<void> {
    // Check that at least one price is provided
    if (takeProfitPrice === null && stopLossPrice === null) {
        throw new Error('At least one of the stop loss or take profit prices must be provided');
    }

    // Build the request parameters
    const params: Record<string, any> = {
        category: 'linear', // Only supporting linear for now
        symbol: marketObject.id, // Use the exchange-specific symbol ID
        tpslMode: 'Full', // Using Full mode as the most common, meaning that the TP/SL will close the position
        positionIdx: '0', // Assuming one-way mode (0). Would need to check position mode for hedge mode support
    };
    if (takeProfitPrice !== null) {
        if (takeProfitPrice === 0) {
            params.takeProfit = '0';
        } else {
            params.takeProfit = exchange.priceToPrecision(marketObject.symbol, takeProfitPrice);
        }
        params.tpTriggerBy = 'MarkPrice';
    }
    if (stopLossPrice !== null) {
        if (stopLossPrice === 0) {
            params.stopLoss = '0';
        } else {
            params.stopLoss = exchange.priceToPrecision(marketObject.symbol, stopLossPrice);
        }
        params.slTriggerBy = 'MarkPrice';
    }

    // Call the API
    const response = await (exchange as bybit).privatePostV5PositionTradingStop(params);
    if (response.retMsg !== 'OK') {
        throw new Error(`Could not attach TP/SL orders to position: ${response.retMsg}`);
    }
}

/**
 * Create a spot entry order with take profit and/or stop loss orders
 * attached to it (UI > https://d.pr/i/b9wWuL + https://d.pr/i/opvK3j)
 *
 * Limit price is compulsory due to both API and UI limitations.
 *
 * The payload sent to the Bybit /v5/order/create endpoint will
 * be of the following form:
 *
 * {
 *   "category":"spot",
 *   "symbol":"BTCUSDT",
 *   "orderType":"Limit",
 *   "side":"Buy",
 *   "qty":"0.001",
 *   "price":"100000",
 *   "timeInForce":"GTC",
 *   "takeProfit": "200000",
 *   "tpOrderType": "Market",
 *   "stopLoss": "50000",
 *   "slOrderType": "Market"
 * }
 *
 * @returns The order id as a string
 * @throws {Error} If something goes wrong
 * @link https://bybit-exchange.github.io/docs/v5/order/create
 */
export async function createSpotEntryOrderWithTakeProfitAndOrStopLossAttached(
    exchange: Exchange,
    marketObject: MarketInterface,
    side: 'buy' | 'sell',
    amount: number,
    limitPrice: number,
    takeProfitPrice: number | null,
    stopLossPrice: number | null,
): Promise<string> {
    // Check that at least one price is provided
    if (takeProfitPrice === null && stopLossPrice === null) {
        throw new Error('At least one of the stop loss or take profit prices must be provided');
    }

    // Build the request parameters
    const params: Record<string, any> = {
        category: 'spot',
        symbol: marketObject.id, // Use the exchange-specific symbol ID
        orderType: 'Limit',
        side: side.charAt(0).toUpperCase() + side.slice(1),
        qty: exchange.amountToPrecision(marketObject.symbol, amount),
        price: exchange.priceToPrecision(marketObject.symbol, limitPrice),
        timeInForce: 'GTC',
        tpOrderType: 'Market',
        slOrderType: 'Market',
    };
    if (takeProfitPrice !== null) {
        params.takeProfit = exchange.priceToPrecision(marketObject.symbol, takeProfitPrice);
    }
    if (stopLossPrice !== null) {
        params.stopLoss = exchange.priceToPrecision(marketObject.symbol, stopLossPrice);
    }

    // Call the API
    const response = await (exchange as bybit).privatePostV5OrderCreate(params);
    if (response.retMsg !== 'OK') {
        throw new Error(`Could not create spot entry order with TP/SL attached: ${response.retMsg}`);
    }

    // Return the order ID
    const orderId = response?.result?.orderId;
    if (!orderId) {
        throw new Error(`Spot entry order sent, but I could not parse the order ID from Bybit response.  Response: ${response}`);
    }
    return orderId;
}

/**
 * Get a specific order by ID on the given exchange.
 *
 * On Bybit, fetchOrder() can only access an order if it is in last 500
 * orders (of any status) for your account.
 *
 * Furthermore, it is not sufficient to know the ID and the market symbol:
 * we also need to specify whether the order is a trigger order or not.
 * Since we do not have a way to know this information, we try to fetch
 * the order with and without the trigger parameter.
 *
 * @throws {OrderNotFound} If the order does not exist or is too old
 */
export async function getOrderById(exchange: Exchange, id: string, symbol?: string): Promise<Order> {
    if (!exchange.has['fetchOrder']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching a single order.`);
    }
    const params = { acknowledged: true, trigger: false }; // to suppress the error about the 500 orders limit
    let order: Order;
    try {
        order = await exchange.fetchOrder(id, symbol, params);
    } catch (error) {
        // If the order is not found, try again with the trigger parameter
        // it any other error happens, rethrow it
        if (error instanceof OrderNotFound === false) {
            throw new Error(`Could not get order: ${error}`);
        }
        try {
            params.trigger = true;
            order = await exchange.fetchOrder(id, symbol, params);
        } catch (error) {
            if (error instanceof OrderNotFound) {
                throw new OrderNotFound(`Could not get order: order does not exist or is too old`);
            }
            throw new Error(`Could not get order: ${error}`);
        }
    }
    return order;
}

/**
 * Get all open orders of the user on the given exchange, regardless
 * of the market type, the settle currency, or whether they are trigger
 * orders or not.
 *
 * Since the Bybit endpoint is very narrow with its arguments, we need to
 * call it multple times, @see https://bybit-exchange.github.io/docs/v5/order/open-order
 *
 * @link https://docs.ccxt.com/#/README?id=understanding-the-orders-api-design
 */
export async function getUserOpenOrders(exchange: Exchange): Promise<Order[]> {
    if (!exchange.has['fetchOpenOrders']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open orders.`);
    }
    exchange.options['warnOnFetchOpenOrdersWithoutSymbol'] = false;
    let orders: Order[] = [];
    const ccxtMarketTypes = [...new Set(SUPPORTED_MARKET_TYPES.map(toCcxtMarketType))];
    // Fetch normal orders and trigger orders
    for (const trigger of [false, true]) {
        // Fetch orders from all market types (spot, futures, option)
        for (const ccxtMarketType of ccxtMarketTypes) {
            if (ccxtMarketType === 'spot') {
                const ccxtOrders = await exchange.fetchOpenOrders(undefined, undefined, undefined, { type: ccxtMarketType, trigger });
                orders.push(...ccxtOrders);
            } else {
                // For leveraged markets, we need to fetch orders for all supported settle currencies
                for (const settleCoin of SUPPORTED_SETTLE_CURRENCIES) {
                    const ccxtOrders = await exchange.fetchOpenOrders(undefined, undefined, undefined, { type: ccxtMarketType, trigger, settleCoin });
                    orders.push(...ccxtOrders);
                }
            }
        }
    }
    // Remove duplicates according to the order ID
    orders = orders.filter((order, index, self) => self.findIndex((t) => t.id === order.id) === index);
    return orders;
}

/**
 * Specify here any option to apply to the exchange object
 */
export function applyExchangeOptions(exchange: Exchange): Exchange {
    // See https://discord.com/channels/690203284119617602/690203284727660739/1267775046366007339
    exchange.options['enableUnifiedAccount'] = true;
    return exchange;
}
