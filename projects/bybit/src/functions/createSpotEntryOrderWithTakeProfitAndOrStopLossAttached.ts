import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createSpotEntryOrderWithTakeProfitAndOrStopLossAttached as createSpotEntryOrderWithTakeProfitAndOrStopLossAttachedHelper } from '../helpers/exchange';
import { formatOrderSingleLine } from '../helpers/format';
import { getOrderById } from '../helpers/exchange';
import { getMarketLastPriceBySymbol, getMarketObject } from '../helpers/markets';
import { convertToBaseAmount } from '../helpers/amount';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    amountCurrency: 'base' | 'spend';
    takeProfitPrice: number | null;
    stopLossPrice: number | null;
    limitPrice: number | null;
}

/**
 * Send an order to create a spot entry order with a TP/SL order attached to it.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.side - Side of the order; either "buy" or "sell"
 * @param props.amount - Amount to trade (in either base or spend currency)
 * @param props.amountCurrency - Whether the amount is in base or spend currency
 * @param props.takeProfitPrice - Price for take profit orders
 * @param props.stopLossPrice - Price for stop loss orders
 * @param props.limitPrice - Price for limit orders; if not provided it will be set to the market price (Bybit requires a limit price to be always set for this kind of orders)
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSpotEntryOrderWithTakeProfitAndOrStopLossAttached(
    { market, side, amount, amountCurrency, takeProfitPrice, stopLossPrice, limitPrice }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        // If the limit price is not provided, set it to the market price
        if (!limitPrice) {
            const lastPrice = await getMarketLastPriceBySymbol(market, exchange);
            notify(`No limit price provided, setting it to the market price: ${lastPrice}`);
            limitPrice = lastPrice;
        }

        // Validate the market type
        const marketObject = await getMarketObject(exchange, market);
        if (marketObject.type !== 'spot') {
            throw new Error(`Market ${market} is not a spot market`);
        }

        // Convert amount to base currency if needed
        const baseAmount = await convertToBaseAmount({
            amount,
            amountCurrency,
            market,
            marketType: 'spot',
            limitPrice,
            exchange,
        });

        // Create the order
        const order = await createSpotEntryOrderWithTakeProfitAndOrStopLossAttachedHelper(exchange, marketObject, side, baseAmount, limitPrice, takeProfitPrice, stopLossPrice);
        notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);

        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        return toResult(`Successfully created ${formatOrderSingleLine(orderObject, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating spot entry order with TP/SL attached: ${error}`, true);
    }
}
