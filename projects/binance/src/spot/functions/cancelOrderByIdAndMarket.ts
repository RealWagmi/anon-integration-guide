import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { MarketInterface, Order } from 'ccxt';
import { formatOrderSingleLine } from '../helpers/format';
import { cancelOrderById, getOrderById } from '../helpers/orders';

interface Props {
	id: string;
	market?: string;
}

/**
 * Cancel a specific order by ID and market symbol.  Certain exchanges do
 * not require the market parameter to be specified.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 *
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to cancel
 * @param {string|undefined} props.market - The symbol of the market, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string confirming the order was cancelled, with the order details
 */
export async function cancelOrderByIdAndMarket({ id, market }: Props, { getCcxtExchange, notify }: FunctionOptions): Promise<FunctionReturn> {
	const exchange = await getCcxtExchange('binance');
	// Fetch the order
	const order = await getOrderById(exchange, id, market);

	// Notify the user
	let marketObject: MarketInterface | undefined;
	if (market) {
		const markets = await exchange.loadMarkets();
		marketObject = markets[market] as MarketInterface;
	}
	await notify(`Order to be cancelled: ${formatOrderSingleLine(order, marketObject)}`);

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
	const cancelledOrder = (await cancelOrderById(exchange, id, market)) as Order;

	return toResult(`Order ${id} on ${market} cancelled: ${formatOrderSingleLine(cancelledOrder, marketObject)}`);
}
