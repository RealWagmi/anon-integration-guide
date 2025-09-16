import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { convertToBaseAmount } from '../helpers/amount';
import { formatOrderSingleLine } from '../helpers/format';
import { getMarketBySymbol } from '../helpers/heyanon';
import { createSimpleOrder as createSimpleOrderHelper, longShortToBuySell } from '../helpers/orders';

interface Props {
	market: string;
	side: 'long' | 'short';
	amount: number;
	amountCurrency: 'BASE' | 'QUOTE';
	limitPrice: number | null;
}

/**
 * Create a simple order, that is, an order that has no conditions attached to it.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'long' | 'short'} props.side - Side of the order; either "long" or "short"
 * @param {number} props.amount - Amount of base currency to long or short
 * @param {string} props.amountCurrency - Specifies whether the amount is denominated in base currency or USD
 * @param {number|null} [props.limitPrice] - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createSimpleOrder({ market, side, amount, amountCurrency, limitPrice }: Props, { getCcxtExchange }: FunctionOptions): Promise<FunctionReturn> {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		const ccxtSide = longShortToBuySell(side);
		const marketObject = await getMarketBySymbol(exchange, market, true);
		market = marketObject.symbol;

		amount = await convertToBaseAmount({ amount, amountCurrency, market, limitPrice, exchange });

		const order = await createSimpleOrderHelper(exchange, market, ccxtSide, amount, limitPrice === null ? undefined : limitPrice);
		return toResult(`Successfully created ${formatOrderSingleLine(order, marketObject, true)}`);
	} catch (error) {
		return toResult(`Error creating order: ${error}`, true);
	}
}
