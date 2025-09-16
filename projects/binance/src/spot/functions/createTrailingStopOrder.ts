import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { createBinanceTrailingStopOrder } from '../helpers/binance';
import { formatOrderSingleLine } from '../helpers/format';

interface Props {
	market: string;
	side: 'buy' | 'sell';
	amount: number;
	amountCurrency: 'BASE' | 'QUOTE';
	stopLossOrTakeProfit: 'STOP_LOSS' | 'TAKE_PROFIT' | 'NOT_SPECIFIED';
	trailingDelta: number;
	limitPrice?: number | null;
}

/**
 * Create a trailing trigger order, that is, a trigger order where the trigger
 * updates if the price moves in a favorable direction for the user.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {'buy' | 'sell'} props.side - Side of the order; either "buy" or "sell"
 * @param {number} props.amount - Amount of base currency to buy or sell
 * @param {string} props.amountCurrency - Specifies whether the amount is denominated in base currency or quote currency
 * @param {'STOP_LOSS' | 'TAKE_PROFIT' | 'NOT_SPECIFIED'} props.stopLossOrTakeProfit - Type of order to create; either "STOP_LOSS" or "TAKE_PROFIT"
 * @param {number} props.trailingDelta - Percentage change in price required to trigger order entry, expressed in BIPS (100 BIPS = 1%)
 * @param {number|null} [props.limitPrice] - Price for limit orders (optional)
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createTrailingStopOrder(
	{ market, side, amount, amountCurrency, stopLossOrTakeProfit, trailingDelta, limitPrice }: Props,
	{ getCcxtExchange }: FunctionOptions,
): Promise<FunctionReturn> {
	if (amountCurrency === 'QUOTE') {
		return toResult('Amount in quote currency is not supported for trailing stop orders', true);
	}

	const exchange = await getCcxtExchange('binance');
	// Fetch market object to provide better feedback to the user
	const markets = await exchange.loadMarkets();
	const marketObject = markets[market];
	// Make sure it is absolutely clear that the user must specify
	// the directionality of the order
	if (stopLossOrTakeProfit === 'NOT_SPECIFIED') {
		return toResult('Please specify if you want to place a STOP LOSS or TAKE PROFIT order', true);
	}
	// Create the order
	try {
		const order = await createBinanceTrailingStopOrder(exchange, market, side, amount, stopLossOrTakeProfit, trailingDelta, limitPrice ?? undefined);
		return toResult(`Successfully created ${formatOrderSingleLine(order, marketObject, false)}`);
	} catch (error) {
		console.error(error);
		return toResult(`Error creating order: ${error}`, true);
	}
}
