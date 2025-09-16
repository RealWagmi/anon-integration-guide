import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketBySymbol } from '../helpers/heyanon';
import { createTrailingStopOrder as createTrailingStopOrderHelper, longShortToBuySell } from '../helpers/orders';

interface Props {
	market: string;
	side: 'long' | 'short';
	amount: number;
	amountCurrency: 'BASE' | 'QUOTE';
	trailingPercent: number;
	limitPrice: number | null;
	triggerPrice: number | null;
	reduceOnly: boolean | null;
}

/**
 * Create a trailing stop order, that is, an order that triggers only when the price
 * moves by a certain percentage in a certain direction.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'long' | 'short'} props.side - Side of the order; either "long" or "short"
 * @param {number} props.amount - Amount of base currency to long or short
 * @param {string} props.amountCurrency - Specifies whether the amount is denominated in base currency or quote currency
 * @param {number} props.trailingPercent - Percentage by which the price must move to trigger the order
 * @param {number|null} [props.triggerPrice] - Price at which the order will be triggered
 * @param {number|null} [props.limitPrice] - Price for limit orders
 * @param {boolean|null} [props.reduceOnly] - If true, the order will only reduce the position size, not increase it, and will not result in a new position being opened.  Defaults to false.
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTrailingStopOrder(
	{ market, side, amount, amountCurrency, trailingPercent: trailingPercentAsInteger, limitPrice, triggerPrice, reduceOnly }: Props,
	{ getCcxtExchange }: FunctionOptions,
): Promise<FunctionReturn> {
	if (amountCurrency === 'QUOTE') {
		return toResult('Amount in quote currency is not supported for trailing stop orders', true);
	}

	try {
		const exchange = await getCcxtExchange('binanceusdm');
		const ccxtSide = longShortToBuySell(side);
		const marketObject = await getMarketBySymbol(exchange, market, true);
		market = marketObject.symbol;
		const params: Record<string, any> = {};
		if (reduceOnly) {
			params.reduceOnly = true;
		}

		const order = await createTrailingStopOrderHelper(
			exchange,
			market,
			ccxtSide,
			amount,
			trailingPercentAsInteger,
			limitPrice === null ? undefined : limitPrice,
			triggerPrice === null ? undefined : triggerPrice,
			params,
		);
		return toResult(`Successfully created ${formatOrderSingleLine(order, marketObject, true)}`);
	} catch (error) {
		return toResult(`Error creating trailing stop order: ${error}`, true);
	}
}
