import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createConditionalOrder, createTakeProfitOrStopLossOrder } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketObject } from '../helpers/markets';
import { getOrderById } from '../helpers/exchange';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    takeProfitTriggerPrice: number;
    takeProfitLimitPrice?: number | null;
    stopLossTriggerPrice: number;
    stopLossLimitPrice?: number | null;
}

/**
 * Create take profit and/or stop loss orders.  If both are provided, they will be
 * created as two conditional orders (so that they do not utilize the user balance).
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.side - Side of the order; either "buy" or "sell"
 * @param props.amount - Amount of base currency to buy or sell
 * @param props.takeProfitTriggerPrice - Price at which the take profit order will be activated
 * @param props.takeProfitLimitPrice - Limit price for TP order (optional)
 * @param props.stopLossTriggerPrice - Price at which the stop loss order will be activated
 * @param props.stopLossLimitPrice - Limit price for SL order (optional)
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSpotTakeProfitAndOrStopLossOrder(
    { market, side, amount, takeProfitTriggerPrice, takeProfitLimitPrice, stopLossTriggerPrice, stopLossLimitPrice }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    // Validate the market type
    const marketObject = await getMarketObject(exchange, market);
    if (marketObject.type !== 'spot') {
        throw new Error(`Market ${market} is not a spot market`);
    }

    // We need at least one trigger price
    if (!takeProfitTriggerPrice && !stopLossTriggerPrice) {
        return toResult(`Error: Either take profit or stop loss trigger price must be provided`, true);
    }

    // Trigger prices cannot be the same
    if (takeProfitTriggerPrice && stopLossTriggerPrice && takeProfitTriggerPrice === stopLossTriggerPrice) {
        return toResult(`Error: The take profit and stop loss trigger prices cannot be the same`, true);
    }

    // Case of a take profit order
    if (takeProfitTriggerPrice && !stopLossTriggerPrice) {
        try {
            // Create the order
            const order = await createTakeProfitOrStopLossOrder(
                exchange,
                market,
                side,
                amount,
                takeProfitTriggerPrice,
                takeProfitLimitPrice === null ? undefined : takeProfitLimitPrice,
            );
            notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);
            // Get the order object
            const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
            return toResult(`Successfully created TP ${formatOrderSingleLine(orderObject, marketObject, false)}`);
        } catch (error) {
            return toResult(`Error creating take profit spot order: ${error}`, true);
        }
    }

    // Case of a stop loss order
    if (!takeProfitTriggerPrice && stopLossTriggerPrice) {
        try {
            // Create the order
            const order = await createTakeProfitOrStopLossOrder(exchange, market, side, amount, stopLossTriggerPrice, stopLossLimitPrice === null ? undefined : stopLossLimitPrice);
            notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);
            // Get the order object
            const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
            return toResult(`Successfully created SL ${formatOrderSingleLine(orderObject, marketObject, false)}`);
        } catch (error) {
            return toResult(`Error creating stop loss spot order: ${error}`, true);
        }
    }

    // Case of a take profit AND stop loss order by
    // sending two conditional orders
    else {
        try {
            const orders = await Promise.all([
                createConditionalOrder(exchange, market, side, amount, takeProfitTriggerPrice, undefined, takeProfitLimitPrice === null ? undefined : takeProfitLimitPrice),
                createConditionalOrder(exchange, market, side, amount, stopLossTriggerPrice, undefined, stopLossLimitPrice === null ? undefined : stopLossLimitPrice),
            ]);
            notify(`Successfully submitted conditional orders with IDs ${orders.map((order) => order.id).join(', ')}, now getting order status...`);
            // Get the order objects
            const tpOrderObject = await getOrderById(exchange, orders[0].id, marketObject.symbol);
            const slOrderObject = await getOrderById(exchange, orders[1].id, marketObject.symbol);
            return toResult(
                `Successfully created the following orders:\n- TP: ${formatOrderSingleLine(tpOrderObject, marketObject, false)}\n- SL: ${formatOrderSingleLine(slOrderObject, marketObject, false)}`,
            );
        } catch (error) {
            return toResult(`Error creating TP/SL spot orders: ${error}`, true);
        }
    }
}
