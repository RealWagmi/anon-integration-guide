import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createTriggerOrder as createTriggerOrderHelper, longShortToBuySell } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketBySymbol } from '../helpers/heyanon';

interface Props {
    market: string;
    side: 'long' | 'short';
    amount: number;
    limitPrice: number | null;
    triggerPrice: number;
    reduceOnly: boolean | null;
}

/**
 * Create a trigger order, that is, an order that has a price condition attached to it.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'long' | 'short'} props.side - Side of the order; either "long" or "short"
 * @param {number} props.amount - Amount of base currency to long or short
 * @param {number|null} [props.limitPrice] - Price for limit orders (optional)
 * @param {boolean|null} [props.reduceOnly] - If true, the order will only reduce the position size, not increase it, and will not result in a new position being opened.  Defaults to false.
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTriggerOrder(
    { market, side, amount, limitPrice, triggerPrice, reduceOnly }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        const ccxtSide = longShortToBuySell(side);
        const marketObject = await getMarketBySymbol(exchange, market, true, notify);
        market = marketObject.symbol;
        const params: Record<string, any> = {};
        if (reduceOnly) {
            params.reduceOnly = true;
        }
        const order = await createTriggerOrderHelper(exchange, market, ccxtSide, amount, triggerPrice, limitPrice === null ? undefined : limitPrice, params);
        return toResult(`Successfully created ${formatOrderSingleLine(order, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating trigger order: ${error}`, true);
    }
}
