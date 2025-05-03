import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createTriggerOrder as createTriggerOrderHelper } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    limitPrice?: number | null;
    triggerPrice: number;
}

/**
 * Create a trigger order, that is, an order that has a price condition attached to it.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {number|null} [props.limitPrice] - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTriggerOrder({ market, side, amount, limitPrice, triggerPrice }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Fetch market object to provide better feedback to the user
    const markets = await exchange.loadMarkets();
    const marketObject = markets[market];
    // Create the order
    try {
        const order = await createTriggerOrderHelper(exchange, market, side, amount, triggerPrice, limitPrice === null ? undefined : limitPrice);
        return toResult(`Successfully created ${formatOrderSingleLine(order, marketObject, false)}`);
    } catch (error) {
        console.error(error);
        return toResult(`Error creating order: ${error}`, true);
    }
}
