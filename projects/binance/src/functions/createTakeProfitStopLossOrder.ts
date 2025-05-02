import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createBinanceOcoOrder } from '../helpers/orders';

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
 * Create two orders: a take profit order and a stop loss order, bundled together in
 * an OCO (one-cancels-the-other) order.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {number} props.takeProfitTriggerPrice - Price at which the take profit order will be activated
 * @param {number} props.stopLossTriggerPrice - Price at which the stop loss order will be activated
 * @param {number|null} props.takeProfitLimitPrice - Price for limit orders (optional)
 * @param {number|null} props.stopLossLimitPrice - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTakeProfitStopLossOrder(
    { market, side, amount, takeProfitTriggerPrice, takeProfitLimitPrice, stopLossTriggerPrice, stopLossLimitPrice }: Props,
    { exchange }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        await createBinanceOcoOrder(
            exchange,
            market,
            side,
            amount,
            takeProfitTriggerPrice,
            stopLossTriggerPrice,
            takeProfitLimitPrice ?? undefined,
            stopLossLimitPrice ?? undefined,
        );
        return toResult(`Successfully created order`);
        // return toResult(`Successfully created ${formatOrderSingleLine(order, undefined, false)}`);
    } catch (error) {
        console.error(error);
        return toResult(`Error creating order: ${error}`, true);
    }
}
