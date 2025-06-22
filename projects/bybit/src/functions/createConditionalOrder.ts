import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createConditionalOrder as createConditionalOrderHelper, toCcxtSide } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { fromCcxtMarketToMarketType, getMarketLastPriceBySymbol, getMarketObject } from '../helpers/markets';
import { getOrderById, SUPPORTED_MARKET_TYPES } from '../helpers/exchange';
import { convertToBaseAmount } from '../helpers/amount';

interface Props {
    market: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    amount: number;
    amountCurrency: 'base' | 'spend';
    triggerPrice: number;
    limitPrice?: number | null;
}

/**
 * Create a conditional order, that is, an order that is activated only
 * after the given price condition is met, and does not utilize your balance
 * until triggered.
 *
 * @param props The function input parameters
 * @param props.market Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.marketType - Market type as inferred from the prompt, e.g. "spot" or "perpetual", used to validate the order
 * @param props.side - Side of the order; either "buy" or "sell" for spot markets, or "long" or "short" for futures markets
 * @param props.amount - Amount to trade (in either base or spend currency)
 * @param props.amountCurrency - Whether the amount is in base or spend currency
 * @param props.triggerPrice Price at which the order will be activated
 * @param props.limitPrice Price for limit orders (optional)
 * @param options The function options
 * @returns A message confirming the order or an error description
 */
export async function createConditionalOrder(
    { market, marketType, side, amount, amountCurrency, limitPrice, triggerPrice }: Props,
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
        // Automatically determine the trigger direction (must be specified
        // for Bybit futures markets)
        let triggerDirection: 'above' | 'below' | undefined;
        if (marketType === 'perpetual' || marketType === 'delivery') {
            const lastPrice = await getMarketLastPriceBySymbol(market, exchange);
            triggerDirection = triggerPrice > lastPrice ? 'above' : 'below';
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
        // Create the order
        const order = await createConditionalOrderHelper(exchange, market, ccxtSide, baseAmount, triggerPrice, triggerDirection, limitPrice === null ? undefined : limitPrice);
        notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);
        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        return toResult(`Successfully created ${formatOrderSingleLine(orderObject, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating conditional order: ${error}`, true);
    }
}
