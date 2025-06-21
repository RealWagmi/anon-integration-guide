import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createPositionWithTakeProfitAndOrStopLossOrderAttached as createPositionWithTakeProfitAndOrStopLossOrderAttachedHelper, toCcxtSide } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { getOrderById, SUPPORTED_MARKET_TYPES } from '../helpers/exchange';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    amount: number;
    takeProfitPrice: number | null;
    stopLossPrice: number | null;
    limitPrice: number | null;
    reduceOnly: boolean | null;
}

/**
 * Create a TP/SL order, that is, an order that has a take profit or stop loss price condition attached,
 * or even both at the same time.
 *
 * You must provide at least one of the take profit or stop loss prices.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.marketType - Market type as inferred from the prompt, e.g. "spot" or "perpetual", used to validate the order
 * @param props.side - Side of the order; either "long" or "short"
 * @param props.amount - Amount of base currency to long or short
 * @param props.takeProfitPrice - Price for take profit orders
 * @param props.stopLossPrice - Price for stop loss orders
 * @param props.limitPrice - Price for limit orders (optional)
 * @param props.reduceOnly - If true, the order will only reduce the position size, not increase it, and will not result in a new position being opened.  Defaults to false.
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createPositionWithTakeProfitAndOrStopLossOrderAttached(
    { market, marketType, side, amount, takeProfitPrice, stopLossPrice, limitPrice, reduceOnly }: Props,
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
        // Make sure that the side is compatible with the market type;
        // if not, tell the LLM to ask the user for clarification
        if (marketType === 'spot' && side !== 'buy' && side !== 'sell') {
            return toResult(`You cannot ${side} a spot market.  If you want to proceed please use '${ccxtSide}' instead of '${side}'.`);
        }
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
            amount,
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
        return toResult(`Error creating trigger order: ${error}`, true);
    }
}
