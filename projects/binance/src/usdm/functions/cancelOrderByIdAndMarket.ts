import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { MarketInterface } from 'ccxt';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketBySymbol } from '../helpers/heyanon';
import { cancelOrderById, getOrderById } from '../helpers/orders';

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
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to cancel
 * @param {string|undefined} props.market - The symbol of the market, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string confirming the order was cancelled, with the order details
 */
export async function cancelOrderByIdAndMarket({ id, market }: Props, { getCcxtExchange, notify }: FunctionOptions): Promise<FunctionReturn> {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		// Get the market object
		let marketObject: MarketInterface | undefined = undefined;
		if (market) {
			marketObject = await getMarketBySymbol(exchange, market, true);
			market = marketObject.symbol;
		}

		// Fetch the order
		const order = await getOrderById(exchange, id, market ?? undefined);

		// Notify the user
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
		await cancelOrderById(exchange, id, market ?? undefined);

		return toResult(`Order ${id} on ${market} cancelled`);
	} catch (error) {
		return toResult(`Error cancelling order: ${error}`, true);
	}
}
