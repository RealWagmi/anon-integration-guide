import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createSimpleOrder as createSimpleOrderHelper, toCcxtSide } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { getOrderById, SUPPORTED_MARKET_TYPES } from '../helpers/exchange';

interface Props {
    market: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    amount: number;
    limitPrice: number | null;
}

/**
 * Create a simple order, that is, an order that has no conditions attached to it.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.side - Side of the order; either "buy" or "sell"
 * @param props.amount - Amount of base currency to buy or sell
 * @param props.limitPrice - Price for limit orders (optional)
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSimpleOrder({ market, side, amount, limitPrice }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Convert the mixed side to a CCXT side
        const ccxtSide = toCcxtSide(side);
        // Check that the market is supported
        const marketObject = await getMarketObject(exchange, market);
        const marketType = fromCcxtMarketToMarketType(marketObject);
        if (!SUPPORTED_MARKET_TYPES.includes(marketType as (typeof SUPPORTED_MARKET_TYPES)[number])) {
            throw new Error(`HeyAnon does not support market ${market} (type ${marketType})`);
        }
        // Make sure that the side is compatible with the market type;
        // if not, tell the LLM to ask the user for clarification
        if (marketType === 'spot' && side !== 'buy' && side !== 'sell') {
            return toResult(`You cannot ${side} a spot market.  If you want to proceed please use '${ccxtSide}' instead of '${side}'.`);
        }
        // Create the order
        const order = await createSimpleOrderHelper(exchange, market, ccxtSide, amount, limitPrice === null ? undefined : limitPrice);
        notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);
        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        return toResult(`Successfully created ${formatOrderSingleLine(orderObject, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating order: ${error}`, true);
    }
}
