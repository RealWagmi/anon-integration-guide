import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createConditionalOrder, createTakeProfitOrStopLossOrder } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketObject } from '../helpers/markets';
import { getOrderById } from '../helpers/exchange';
import { convertTargetToAbsolutePrice } from '../helpers/amount';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    takeProfitTriggerPrice: number;
    takeProfitType: 'absolute' | 'percentage' | null;
    takeProfitLimitPrice?: number | null;
    stopLossTriggerPrice: number;
    stopLossType: 'absolute' | 'percentage' | null;
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
 * @param props.takeProfitType - Type of take profit price (absolute or percentage)
 * @param props.takeProfitLimitPrice - Limit price for TP order (optional)
 * @param props.stopLossTriggerPrice - Price at which the stop loss order will be activated
 * @param props.stopLossType - Type of stop loss price (absolute or percentage)
 * @param props.stopLossLimitPrice - Limit price for SL order (optional)
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSpotTakeProfitAndOrStopLossOrder(
    { market, side, amount, takeProfitTriggerPrice, takeProfitType, takeProfitLimitPrice, stopLossTriggerPrice, stopLossType, stopLossLimitPrice }: Props,
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

    // Convert TP percentage values to absolute prices if needed
    let absoluteTakeProfitPrice: number | null = null;
    if (takeProfitTriggerPrice) {
        if (takeProfitType === null) {
            throw new Error('Could not determine whether the take profit price is an absolute or percentage value');
        }
        absoluteTakeProfitPrice = await convertTargetToAbsolutePrice({
            targetValue: takeProfitTriggerPrice,
            targetType: takeProfitType,
            type: 'takeProfit',
            side: side,
            market: market,
            exchange: exchange,
        });
        if (takeProfitType === 'percentage') {
            notify(`${takeProfitTriggerPrice}% TP price: ${absoluteTakeProfitPrice}`);
        }
    }

    // Convert SL percentage values to absolute prices if needed
    let absoluteStopLossPrice: number | null = null;
    if (stopLossTriggerPrice) {
        if (stopLossType === null) {
            throw new Error('Could not determine whether the stop loss price is an absolute or percentage value');
        }
        absoluteStopLossPrice = await convertTargetToAbsolutePrice({
            targetValue: stopLossTriggerPrice,
            targetType: stopLossType,
            type: 'stopLoss',
            side: side,
            market: market,
            exchange: exchange,
        });
        if (stopLossType === 'percentage') {
            notify(`${stopLossTriggerPrice}% SL price: ${absoluteStopLossPrice}`);
        }
    }

    // Trigger prices cannot be the same
    if (absoluteTakeProfitPrice && absoluteStopLossPrice && absoluteTakeProfitPrice === absoluteStopLossPrice) {
        return toResult(`Error: The take profit and stop loss trigger prices cannot be the same`, true);
    }

    // Case of a take profit order
    if (absoluteTakeProfitPrice && !absoluteStopLossPrice) {
        try {
            // Create the order
            const order = await createTakeProfitOrStopLossOrder(
                exchange,
                market,
                side,
                amount,
                absoluteTakeProfitPrice,
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
    if (!absoluteTakeProfitPrice && absoluteStopLossPrice) {
        try {
            // Create the order
            const order = await createTakeProfitOrStopLossOrder(
                exchange,
                market,
                side,
                amount,
                absoluteStopLossPrice,
                stopLossLimitPrice === null ? undefined : stopLossLimitPrice,
            );
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
                createConditionalOrder(exchange, market, side, amount, absoluteTakeProfitPrice!, undefined, takeProfitLimitPrice === null ? undefined : takeProfitLimitPrice),
                createConditionalOrder(exchange, market, side, amount, absoluteStopLossPrice!, undefined, stopLossLimitPrice === null ? undefined : stopLossLimitPrice),
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
