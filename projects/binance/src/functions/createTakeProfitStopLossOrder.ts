import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createBinanceOcoOrder, createTriggerOrder } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';

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
 * created as an OCO (one-cancels-the-other) order.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {number|null} props.takeProfitTriggerPrice - Price at which the take profit order will be activated
 * @param {number|null} props.stopLossTriggerPrice - Price at which the stop loss order will be activated
 * @param {number|null} props.takeProfitLimitPrice - Price for limit orders (optional)
 * @param {number|null} props.stopLossLimitPrice - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTakeProfitStopLossOrder(
    { market, side, amount, takeProfitTriggerPrice, takeProfitLimitPrice, stopLossTriggerPrice, stopLossLimitPrice }: Props,
    { exchange }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
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
            const order = await createTriggerOrder(exchange, market, side, amount, takeProfitTriggerPrice, takeProfitLimitPrice === null ? undefined : takeProfitLimitPrice);
            return toResult(`Successfully created ${formatOrderSingleLine(order, undefined, false)}`);
        } catch (error) {
            console.error(error);
            return toResult(`Error creating take profit order: ${error}`, true);
        }
    }
    // Case of a stop loss order
    if (!takeProfitTriggerPrice && stopLossTriggerPrice) {
        try {
            const order = await createTriggerOrder(exchange, market, side, amount, stopLossTriggerPrice, stopLossLimitPrice === null ? undefined : stopLossLimitPrice);
            return toResult(`Successfully created ${formatOrderSingleLine(order, undefined, false)}`);
        } catch (error) {
            console.error(error);
            return toResult(`Error creating stop loss order: ${error}`, true);
        }
    }
    // Case of a take profit AND stop loss order (OCO)
    else {
        try {
            const orders = await createBinanceOcoOrder(
                exchange,
                market,
                side,
                amount,
                takeProfitTriggerPrice,
                stopLossTriggerPrice,
                takeProfitLimitPrice ?? undefined,
                stopLossLimitPrice ?? undefined,
            );
            return toResult(`Successfully created two OCO orders:\n${formatOrderSingleLine(orders[0], undefined, false)}\n${formatOrderSingleLine(orders[1], undefined, false)}`);
        } catch (error) {
            console.error(error);
            return toResult(`Error creating OCO order: ${error}`, true);
        }
    }
}
