import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderSingleLine } from '../helpers/format';
import { cancelOrderById } from '../helpers/orders';
import { getOrderById } from '../helpers/exchange';
import { getMarketObject } from '../helpers/markets';

interface Props {
    id: string;
    market: string | null;
}

/**
 * Cancel a specific order by ID and market symbol.  Certain exchanges do
 * not require the market parameter to be specified.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 *
 * @param props - The function input parameters
 * @param props.id - The ID of the order to cancel
 * @param props.market - The symbol of the market
 * @param options
 * @returns A string confirming the order was cancelled, with the order details
 */
export async function cancelOrderByIdAndMarket({ id, market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Fetch the order
        const order = await getOrderById(exchange, id, market ?? undefined);

        // Get market object
        const marketObject = await getMarketObject(exchange, order.symbol);

        // Notify the user
        notify(`Order to be cancelled: ${formatOrderSingleLine(order, marketObject)}`);

        // Make sure the order exists and is open
        if (!order) {
            return toResult(`Order ${id} on ${market} not found`, true);
        }
        if (order.status === 'canceled') {
            return toResult(`Order ${id} on ${market} already cancelled`, true);
        }
        if (order.status === 'closed') {
            return toResult(`Order ${id} on ${market} already closed`, true);
        }
        if (order.status !== 'open') {
            return toResult(`Order ${id} on ${market} is not open`, true);
        }

        // Cancel the order
        await cancelOrderById(exchange, id, market ?? undefined);

        return toResult(`Order ${id} on ${market} cancelled`);
    } catch (error) {
        return toResult(`Error cancelling order: ${error}`, true);
    }
}
