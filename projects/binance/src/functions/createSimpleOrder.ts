import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createSimpleOrder as createSimpleOrderHelper } from '../helpers/orders';
import { formatOrderSingleLine } from '../helpers/format';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    limitPrice?: number | null;
}

/**
 * Create a simple order, that is, an order that has no conditions attached to it.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {number|null} [props.limitPrice] - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createSimpleOrder({ market, side, amount, limitPrice }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        const order = await createSimpleOrderHelper(exchange, market, side, amount, limitPrice === null ? undefined : limitPrice);
        return toResult(`Successfully created ${formatOrderSingleLine(order, undefined, false)}`);
    } catch (error) {
        console.error(error);
        return toResult(`Error creating order: ${error}`, true);
    }
}
