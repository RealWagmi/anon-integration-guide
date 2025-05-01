import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createOrder as createOrderHelper } from '../helpers/orders';
import { ORDER_TYPES } from '../constants';

interface Props {
    market: string;
    type: (typeof ORDER_TYPES)[number];
    side: 'buy' | 'sell';
    amount: number;
    price?: number | null;
    triggerPrice?: number | null;
    ocoStopLoss?: {
        triggerPrice: number;
        price?: number;
    } | null;
    ocoTakeProfit?: {
        triggerPrice: number;
        price?: number;
    } | null;
    trailingPercent?: number | null;
    trailingAmount?: number | null;
    reduceOnly?: boolean | null;
}

/**
 * Create an advanced order with support for various order types.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {(typeof ORDER_TYPES)[number]} props.type - Type of order to create
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {number|null} [props.price] - Price for limit orders (required for limit orders, optional for others)
 * @param {number|null} [props.triggerPrice] - Trigger price for trigger, stop loss, and take profit orders
 * @param {Object|null} [props.ocoStopLoss] - Stop loss configuration for OCO orders
 * @param {Object|null} [props.ocoTakeProfit] - Take profit configuration for OCO orders
 * @param {number|null} [props.trailingPercent] - Percentage away from market price for trailing orders
 * @param {number|null} [props.trailingAmount] - Fixed amount away from market price for trailing orders
 * @param {boolean|null} [props.reduceOnly] - Whether the order should only reduce position size
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createOrder(
    {
        market,
        type,
        side,
        amount,
        price = null,
        triggerPrice = null,
        ocoStopLoss = null,
        ocoTakeProfit = null,
        trailingPercent = null,
        trailingAmount = null,
        reduceOnly = null,
    }: Props,
    { exchange }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        // Validate required parameters based on order type
        if (type === 'limit' && price === null) {
            return toResult('Limit orders require a price', true);
        }

        if ((type === 'trigger' || type === 'stop_loss' || type === 'take_profit') && triggerPrice === null) {
            return toResult(`${type} orders require a triggerPrice`, true);
        }

        if (type === 'oco' && (!ocoStopLoss || !ocoTakeProfit)) {
            return toResult('OCO orders require both ocoStopLoss and ocoTakeProfit configurations', true);
        }

        if (type === 'trailing' && trailingPercent === null && trailingAmount === null) {
            return toResult('Trailing orders require either trailingPercent or trailingAmount', true);
        }

        // Create the order using the helper function
        const order = await createOrderHelper(exchange, market, type, side, amount, price, {
            triggerPrice,
            ocoStopLoss,
            ocoTakeProfit,
            trailingPercent,
            trailingAmount,
            reduceOnly,
        });

        // Format the response
        return toResult(`Successfully created a ${type} ${side} order for ${amount} ${market.split('/')[0]} on ${market}. Order ID: ${order.id}`);
    } catch (error: any) {
        console.error('Error creating advanced order:', error);
        return toResult(`Error creating order: ${error.message || 'Unknown error'}`, true);
    }
}
