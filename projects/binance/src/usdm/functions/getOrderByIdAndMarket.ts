import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { MarketInterface } from 'ccxt';
import { formatOrderMultiLine } from '../helpers/format';
import { completeMarketSymbol } from '../helpers/markets';
import { getOrderById } from '../helpers/orders';

interface Props {
	id: string;
	market: string | null;
}

/**
 * Get details on the given order by its ID and market symbol.  Certain
 * exchanges do not require the market parameter to be specified.
 *
 * @param {FunctionOptions} options HeyAnon SDK options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to get details on
 * @param {string|null} props.market - The symbol of the market, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string with the details on the order
 */
export async function getOrderByIdAndMarket({ id, market }: Props, { getCcxtExchange }: FunctionOptions): Promise<FunctionReturn> {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		// Infer market symbol from partial symbol
		if (market) {
			market = completeMarketSymbol(market);
		}
		// Get order
		const order = await getOrderById(exchange, id, market ?? undefined);
		if (!order) {
			return toResult('Order not found', true);
		}

		// Get market object
		let marketObject: MarketInterface | undefined;
		if (market) {
			const markets = await exchange.loadMarkets();
			marketObject = markets[market] as MarketInterface;
		}

		return toResult(formatOrderMultiLine(order, marketObject));
	} catch (error) {
		return toResult(`Error getting order: ${error}`, true);
	}
}
