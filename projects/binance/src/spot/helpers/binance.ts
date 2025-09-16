import { Exchange, Order } from 'ccxt';
import { MAX_TRAILING_DELTA, MIN_TRAILING_DELTA } from '../constants';

/**
 * The types of orders that Binance API supports.
 *
 * @link https://developers.binance.com/docs/binance-spot-api-docs/enums#ordertypes
 */
export const BINANCE_ORDER_TYPES = ['LIMIT', 'LIMIT_MAKER', 'MARKET', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'TRAILING_STOP_MARKET'] as const;

/**
 * Create a spot OCO order using CCXT implicit API for Binance
 *
 * An OCO order (one-cancels-the-other) contains a take profit and a stop loss
 * order for the same amount.
 *
 * @link https://d.pr/i/G72YL7 UI SCREENSHOT
 * @link https://gist.github.com/coccoinomane/efeb6e213e5d34ca66ebdc72b478a215
 * @link https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints#new-order-list---oco-trade
 *
 * @param {Exchange} exchange - The exchange object
 * @param {string} symbol - The symbol of the market
 * @param {'buy' | 'sell'} side - The side of the order
 * @param {number} amount - The amount of the order
 * @param {number} takeProfitTriggerPrice - The trigger price of the take profit order
 * @param {number} stopLossTriggerPrice - The trigger price of the stop loss order
 * @param {number} [takeProfitLimitPrice] - The limit price of the take profit order
 * @param {number} [stopLossLimitPrice] - The limit price of the stop loss order
 * @returns {[Order, Order]} - The two orders created
 */
export async function createBinanceOcoOrder(
	exchange: Exchange,
	symbol: string,
	side: 'buy' | 'sell',
	amount: number,
	takeProfitTriggerPrice: number,
	stopLossTriggerPrice: number,
	takeProfitLimitPrice?: number,
	stopLossLimitPrice?: number,
): Promise<[Order, Order]> {
	// Fetch market object
	const markets = await exchange.loadMarkets();
	const market = markets[symbol];
	if (!market) {
		throw new Error(`Market ${symbol} not found`);
	}

	// Determine parameters to send Binance
	const args: any = {
		symbol: market.id,
		side: side.toUpperCase(),
		quantity: exchange.amountToPrecision(symbol, amount),
		newOrderRespType: 'FULL',
	};

	if (side === 'sell') {
		// Above order is a take profit order
		args.aboveType = takeProfitLimitPrice ? 'TAKE_PROFIT_LIMIT' : 'TAKE_PROFIT';
		args.aboveStopPrice = exchange.priceToPrecision(symbol, takeProfitTriggerPrice);
		if (takeProfitLimitPrice) {
			args.abovePrice = exchange.priceToPrecision(symbol, takeProfitLimitPrice);
			args.aboveTimeInForce = 'GTC';
		}
		// Below order is a stop loss order
		args.belowType = stopLossLimitPrice ? 'STOP_LOSS_LIMIT' : 'STOP_LOSS';
		args.belowStopPrice = exchange.priceToPrecision(symbol, stopLossTriggerPrice);
		if (stopLossLimitPrice) {
			args.belowPrice = exchange.priceToPrecision(symbol, stopLossLimitPrice);
			args.belowTimeInForce = 'GTC';
		}
	} else {
		// Above order is a stop loss order
		args.aboveType = stopLossLimitPrice ? 'STOP_LOSS_LIMIT' : 'STOP_LOSS';
		args.aboveStopPrice = exchange.priceToPrecision(symbol, stopLossTriggerPrice);
		if (stopLossLimitPrice) {
			args.abovePrice = exchange.priceToPrecision(symbol, stopLossLimitPrice);
			args.aboveTimeInForce = 'GTC';
		}
		// Below order is a take profit order
		args.belowType = takeProfitLimitPrice ? 'TAKE_PROFIT_LIMIT' : 'TAKE_PROFIT';
		args.belowStopPrice = exchange.priceToPrecision(symbol, takeProfitTriggerPrice);
		if (takeProfitLimitPrice) {
			args.belowPrice = exchange.priceToPrecision(symbol, takeProfitLimitPrice);
			args.belowTimeInForce = 'GTC';
		}
	}
	// Send the request to Binance
	const response = await (exchange as any).privatePostOrderListOco(args);

	// Parse the response into two orders
	try {
		const binanceOrders = response.orderReports;
		return binanceOrders.map((o: any) => exchange.parseOrder(o, market));
	} catch (error) {
		console.error(error);
		throw new Error(`createBinanceOcoOrder: Could not parse orders from Binance response.  Response: ${response}`);
	}
}

/**
 * Create a spot trailing stop order using CCXT implicit API for Binance
 *
 * A trailing stop order is a stop loss order that moves up or down as
 * the price moves up or down.
 *
 * Intuitively, trailing stop orders allow unlimited price movement in a direction
 * that is beneficial for the order, and limited movement in a detrimental direction.
 *
 * @link https://d.pr/i/uZBFJc UI SCREENSHOT
 * @link https://github.com/binance/binance-spot-api-docs/blob/master/faqs/trailing-stop-faq.md
 * @link https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints#new-order-trade
 *
 * @param {Exchange} exchange - The exchange object
 * @param {string} symbol - The symbol of the market
 * @param {'buy' | 'sell'} side - The side of the order
 * @param {number} amount - The amount of the order
 * @param {'STOP_LOSS' | 'TAKE_PROFIT'} stopLossOrTakeProfit - Whether the order is a stop loss or take profit order.  One could try to infer this from the other parameters, but we confide the user knows what they want.
 * @param {number} trailingDelta - Percent change in price required to trigger order entry, expressed in BIPS (100 BIPS = 1%)
 * @param {number} [limitPrice] - The limit price of the order once the trailing stop is triggered ("Limit" in the UI, "price" in the Binance API).  If omitted, the order will be executed as soon as the trailing stop is triggered.
 * @param {number} [triggerPrice] - The trigger price needed to activate the trailing stop order ("Activation price" in the UI, "stopPrice" in the Binance API).  If omitted, the order will be activated immediately.
 * @returns {[Order, Order]} - The two orders created
 */
export async function createBinanceTrailingStopOrder(
	exchange: Exchange,
	symbol: string,
	side: 'buy' | 'sell',
	amount: number,
	stopLossOrTakeProfit: 'STOP_LOSS' | 'TAKE_PROFIT',
	trailingDelta: number,
	limitPrice?: number,
	triggerPrice?: number,
): Promise<Order> {
	// Fetch market object
	const markets = await exchange.loadMarkets();
	const market = markets[symbol];
	if (!market) {
		throw new Error(`Market ${symbol} not found`);
	}

	// Validate trailing delta
	if (trailingDelta < MIN_TRAILING_DELTA || trailingDelta > MAX_TRAILING_DELTA) {
		throw new Error(`trailingDelta must be between ${MIN_TRAILING_DELTA} and ${MAX_TRAILING_DELTA} BIPS (100 BIPS = 1%).  You provided ${trailingDelta}.`);
	}

	// Determine parameters to send Binance
	const args: any = {
		symbol: market.id,
		side: side.toUpperCase(),
		quantity: exchange.amountToPrecision(symbol, amount),
		newOrderRespType: 'FULL',
		trailingDelta: trailingDelta,
	};

	// Determine order type
	if (limitPrice) {
		args.type = stopLossOrTakeProfit === 'STOP_LOSS' ? 'STOP_LOSS_LIMIT' : 'TAKE_PROFIT_LIMIT';
		args.price = exchange.priceToPrecision(symbol, limitPrice);
		args.timeInForce = 'GTC';
	} else {
		args.type = stopLossOrTakeProfit;
	}

	if (!BINANCE_ORDER_TYPES.includes(args.type)) {
		throw new Error(`Invalid order type: ${args.type}.  Must be one of: ${BINANCE_ORDER_TYPES.join(', ')}.`);
	}

	// Should the order be activated immediately or upon the price moving by a certain amount?
	if (triggerPrice) {
		args.stopPrice = exchange.priceToPrecision(symbol, triggerPrice);
	}

	// Send the request to Binance
	const response = await (exchange as any).privatePostOrder(args);

	// Parse the response into an order
	try {
		return exchange.parseOrder(response, market);
	} catch (error) {
		console.error(error);
		throw new Error(`createBinanceTrailingStopOrder: Could not parse order from Binance response.  Response: ${response}`);
	}
}
