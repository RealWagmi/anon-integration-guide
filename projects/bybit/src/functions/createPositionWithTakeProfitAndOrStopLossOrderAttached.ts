import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createPositionWithTakeProfitAndOrStopLossOrderAttached as createPositionWithTakeProfitAndOrStopLossOrderAttachedHelper, toCcxtSide } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { getOrderById, SUPPORTED_MARKET_TYPES } from '../helpers/exchange';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { convertToBaseAmount } from '../helpers/amount';

interface Props {
    market: string;
    side: 'long' | 'short';
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    amount: number;
    amountCurrency: 'base' | 'spend';
    takeProfitPrice: number | null;
    stopLossPrice: number | null;
    limitPrice: number | null;
    reduceOnly: boolean | null;
}

/**
 * Send an order to create a position with a TP/SL order attached to it.
 *
 * TODO: Might be a good idea to warn the user if there's already an existing
 * position on the market, because the TP/SL will be attached to the whole
 * existing position, and not just to the amount being added/removed.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.marketType - Market type as inferred from the prompt, used to validate the order
 * @param props.side - Side of the order; either "long" or "short"
 * @param props.amount - Amount to trade (in either base or spend currency)
 * @param props.amountCurrency - Whether the amount is in base or spend currency
 * @param props.takeProfitPrice - Price for take profit orders
 * @param props.stopLossPrice - Price for stop loss orders
 * @param props.limitPrice - Price for limit orders (optional)
 * @param props.reduceOnly - If true, the order will only reduce the position size, not increase it, and will not result in a new position being opened.  Defaults to false.
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createPositionWithTakeProfitAndOrStopLossOrderAttached(
    { market, marketType, side, amount, amountCurrency, takeProfitPrice, stopLossPrice, limitPrice, reduceOnly }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        // Convert the mixed side to a CCXT side
        const ccxtSide = toCcxtSide(side);

        // Validate the market type
        const marketObject = await getMarketObject(exchange, market);
        const marketTypeInferredFromMarketSymbol = fromCcxtMarketToMarketType(marketObject);
        if (marketTypeInferredFromMarketSymbol !== marketType) {
            throw new Error(`Please clarify whether you want to trade on a ${marketType} or ${marketTypeInferredFromMarketSymbol} market`);
        }
        if (!SUPPORTED_MARKET_TYPES.includes(marketType as (typeof SUPPORTED_MARKET_TYPES)[number])) {
            throw new Error(`HeyAnon does not support markets of type ${marketType}`);
        }

        // Convert amount to base currency if needed
        const baseAmount = await convertToBaseAmount({
            amount,
            amountCurrency,
            market,
            marketType,
            limitPrice,
            exchange,
        });

        // Include optional parameter reduceOnly
        const params: Record<string, any> = {};
        if (reduceOnly) {
            params.reduceOnly = true;
        }

        // Create the order
        const order = await createPositionWithTakeProfitAndOrStopLossOrderAttachedHelper(
            exchange,
            market,
            ccxtSide,
            baseAmount,
            takeProfitPrice,
            stopLossPrice,
            limitPrice === null ? undefined : limitPrice,
            params,
        );
        notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);

        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        return toResult(`Successfully created ${formatOrderSingleLine(orderObject, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating position with TP/SL attached: ${error}`, true);
    }
}
