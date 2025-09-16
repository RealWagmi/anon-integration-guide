import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { MarketInterface } from 'ccxt';
import { formatOrderMultiLine } from '../helpers/format';
import { getOrderById } from '../helpers/orders';

interface Props {
	id: string;
	market?: string;
}

/**
 * Get details on the given order by its ID and market symbol.  Certain
 * exchanges do not require the market parameter to be specified.
 *
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to get details on
 * @param {string|undefined} props.market - The symbol of the market, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string with the details on the order
 */
export async function getOrderByIdAndMarket({ id, market }: Props, { getCcxtExchange }: FunctionOptions): Promise<FunctionReturn> {
	const exchange = await getCcxtExchange('binance');
	const order = await getOrderById(exchange, id, market);
	if (!order) {
		return toResult('Order not found', true);
	}

	let marketObject: MarketInterface | undefined;
	if (market) {
		const markets = await exchange.loadMarkets();
		marketObject = markets[market] as MarketInterface;
	}

	return toResult(formatOrderMultiLine(order, marketObject));
}
