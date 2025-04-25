import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderSingleLine } from '../helpers/format';
import { MarketInterface, Order } from 'ccxt';
import { cancelOrderById, getOrderById } from '../helpers/orders';

interface Props {
    id: string;
    symbol: string; // Binance specific
}

/**
 * Cancel a specific order by ID and trading pair symbol.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 *
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to cancel
 * @param {string} props.symbol - The symbol of the market
 * @returns {Promise<FunctionReturn>} A string confirming the order was cancelled, with the order details
 */
export async function cancelOrderByIdAndSymbol({ id, symbol }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Notify the user
    const order = await getOrderById(exchange, id, symbol);
    const markets = await exchange.loadMarkets();
    const market = markets[symbol] as MarketInterface;
    notify(`Order to be cancelled: ${formatOrderSingleLine(order, market)}`);

    // Make sure the order exists and is open
    if (!order) {
        return toResult(`Order ${id} on ${symbol} not found`, true);
    }
    if (order.status === 'canceled') {
        return toResult(`Order ${id} on ${symbol} already cancelled`, true);
    }
    if (order.status === 'closed') {
        return toResult(`Order ${id} on ${symbol} already closed`, true);
    }
    if (order.status !== 'open') {
        return toResult(`Order ${id} on ${symbol} is not open`, true);
    }

    // Cancel the order
    const cancelledOrder = (await cancelOrderById(exchange, id, symbol)) as Order;

    return toResult(`Order ${id} on ${symbol} cancelled: ${formatOrderSingleLine(cancelledOrder, market)}`);
}
