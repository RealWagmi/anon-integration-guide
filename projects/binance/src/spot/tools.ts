import { AdapterExport } from '@heyanon/sdk';
import { ACCOUNT_TYPES, MAX_ORDERS_IN_RESULTS, MAX_TRAILING_DELTA, MIN_TRAILING_DELTA } from './constants';

const SIDE_DESCRIPTION = [
	'Side of the order, either "buy" or "sell".  Buy and sell are ALWAYS relative to the FIRST (base) currency in the market symbol.',
	'',
	'Examples to avoid confusion (especially when the user speaks in terms of the quote currency):',
	'• Market "BTC/USDT":',
	'    – side = "buy" → you are BUYING BTC and paying with USDT.',
	'    – side = "sell" → you are SELLING BTC and receiving USDT.',
	'    – Natural-language request: "Sell all my USDT for BTC" → side = "buy" on market "BTC/USDT" (because you are ultimately buying BTC).',
	'    – Natural-language request: "Buy USDT with BTC" → side = "sell" on market "BTC/USDT" (because you are ultimately selling BTC).',
	'',
	'When in doubt, rewrite the user sentence so the first currency is the one being bought (side = "buy") or sold (side = "sell").',
].join(' ');

const MARKET_DESCRIPTION =
	'Symbol of the market to trade, e.g. "BTC/USDT".  The FIRST (base) currency is the asset you are actually buying (side = "buy") or selling (side = "sell").  For a request like "sell USDT for BTC" you must use market "BTC/USDT" with side = "buy".';

const AMOUNT_DESCRIPTION = [
	'Amount is the FINAL trade size to transact; do NOT scale, prorate, or recalc it by price.',
	'User always provides the final size. You must pass it as-is using the correct "amountCurrency" value.',
	'amountCurrency:',
	'• BASE — the first currency of the market symbol (e.g., BTC in BTC/USDT). If the user gives a BASE amount, use it directly as the trade size in BASE.',
	'• QUOTE — the second currency of the market symbol (e.g., USDT in BTC/USDT). If the user gives a QUOTE amount, use it directly as the trade size in QUOTE notional. For QUOTE, USD / $ / USDT / USDC are treated the same (USD = USDT/USDC).',
	'Do NOT convert between BASE and QUOTE.',
].join(' ');

export const tools = [
	{
		type: 'function',
		function: {
			name: 'createSimpleOrder',
			description:
				'Create an order that is activated immediately, without a trigger attached to it.  The order will execute at the current market price or a specified limit price.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'limitPrice'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['buy', 'sell'],
						description: SIDE_DESCRIPTION,
					},
					amount: {
						type: 'number',
						description: AMOUNT_DESCRIPTION,
					},
					amountCurrency: { type: 'string', enum: ['BASE', 'QUOTE'], description: 'Specifies whether the amount is denominated in base currency or quote currency' },
					limitPrice: {
						type: ['number', 'null'],
						description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  Leave blank for a market order.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'createTriggerOrder',
			description:
				'Create an order that is activated only after the given price condition is met. Once activated, the order will be executed at either the current market price or a specified limit price.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'triggerPrice', 'limitPrice'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['buy', 'sell'],
						description: SIDE_DESCRIPTION,
					},
					amount: {
						type: 'number',
						description: AMOUNT_DESCRIPTION,
					},
					amountCurrency: { type: 'string', enum: ['BASE', 'QUOTE'], description: 'Specifies whether the amount is denominated in base currency or quote currency' },
					limitPrice: {
						type: ['number', 'null'],
						description:
							'Price at which the order will be executed.  Include only if explicitly specified by the user.  If not specified, the order will be a market order.',
					},
					triggerPrice: {
						type: 'number',
						description: 'Price at which the order will be activated',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'createTakeProfitStopLossOrder',
			description: 'Create take profit and/or stop loss orders.  If both are provided, they will be created as an OCO (one-cancels-the-other) order.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'takeProfitTriggerPrice', 'takeProfitLimitPrice', 'stopLossTriggerPrice', 'stopLossLimitPrice'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['buy', 'sell'],
						description: SIDE_DESCRIPTION,
					},
					amount: {
						type: 'number',
						description: AMOUNT_DESCRIPTION,
					},
					amountCurrency: { type: 'string', enum: ['BASE', 'QUOTE'], description: 'Specifies whether the amount is denominated in base currency or quote currency' },
					takeProfitTriggerPrice: {
						type: ['number', 'null'],
						description:
							'Price at which the take profit order will be activated.  For sell orders, must be higher than stop loss trigger price.  For buy orders, must be lower than stop loss trigger price.  If not specified, the take profit order will not be created.',
					},
					takeProfitLimitPrice: {
						type: ['number', 'null'],
						description: 'Price at which the take profit order will be executed.  If not specified, the order will be a market order.',
					},
					stopLossTriggerPrice: {
						type: ['number', 'null'],
						description: 'Price at which the stop loss order will be activated.  If not specified, the stop loss order will not be created.',
					},
					stopLossLimitPrice: {
						type: ['number', 'null'],
						description: 'Price at which the stop loss order will be executed.  If not specified, the order will be a market order.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'createTrailingStopOrder',
			description: 'Create a trailing stop order.  The order can be either a stop loss or take profit.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'stopLossOrTakeProfit', 'trailingDelta', 'limitPrice'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['buy', 'sell'],
						description: SIDE_DESCRIPTION,
					},
					amount: {
						type: 'number',
						description: AMOUNT_DESCRIPTION + 'The amount for this order (trailing stop order) is always specified in the base currency.',
					},
					amountCurrency: { type: 'string', enum: ['BASE', 'QUOTE'], description: 'Specifies whether the amount is denominated in base currency or quote currency' },
					stopLossOrTakeProfit: {
						type: 'string',
						enum: ['STOP_LOSS', 'TAKE_PROFIT', 'NOT_SPECIFIED'],
						description: 'Whether to create a STOP LOSS or TAKE PROFIT order.  If it is not 100% clear what the user wants, leave blank.',
					},
					trailingDelta: {
						type: 'number',
						description: `Percentage change in price required to trigger order entry, expressed in BIPS (100 BIPS = 1%).  Must be between ${MIN_TRAILING_DELTA} and ${MAX_TRAILING_DELTA}.`,
					},
					limitPrice: {
						type: ['number', 'null'],
						description:
							'Price at which the order will be executed, after the trailing stop is triggered.  Include only if explicitly specified by the user.  If not specified, the order will be a market order.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'cancelOrderByIdAndMarket',
			description: 'Cancel a specific order by ID and market symbol.  If you only have the order ID, use getOpenOrders to get the market symbol.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['id', 'market'],
				additionalProperties: false,
				properties: {
					id: {
						type: 'string',
						description: 'Order ID to cancel',
					},
					market: {
						type: 'string',
						description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'cancelAllOrdersOnMarket',
			description: 'Cancel all open orders on a given market',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Symbol of the market to cancel orders on, e.g. "BTC/USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'transferFunds',
			description: 'Transfer funds between accounts of the same user, e.g. from spot to future account',
			strict: true,
			parameters: {
				type: 'object',
				required: ['currency', 'amount', 'from', 'to'],
				additionalProperties: false,
				properties: {
					currency: {
						type: 'string',
						description: 'Currency to transfer, e.g. "USDT"',
					},
					amount: {
						type: 'number',
						description: 'Amount to transfer',
					},
					from: {
						type: ['string', 'null'],
						enum: ACCOUNT_TYPES,
						description: 'Account to transfer from.  e.g. "spot" or "future".  Defaults to "spot" or "future".',
					},
					to: {
						type: 'string',
						enum: ACCOUNT_TYPES,
						description: 'Account to transfer to.  e.g. "spot" or "future"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getOpenOrders',
			description: `Show the most recent ${MAX_ORDERS_IN_RESULTS} open orders`,
			strict: true,
			parameters: {
				type: 'object',
				required: [],
				additionalProperties: false,
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getOrderByIdAndMarket',
			description: 'Get information about a specific order by ID and market symbol',
			strict: true,
			parameters: {
				type: 'object',
				required: ['id', 'market'],
				additionalProperties: false,
				properties: {
					id: {
						type: 'string',
						description: 'Order ID to get information for',
					},
					market: {
						type: 'string',
						description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getBalance',
			description: 'Get user balance.  For each currency, also show how much is available to trade (free).',
			strict: true,
			parameters: {
				type: 'object',
				required: ['type', 'currency'],
				additionalProperties: false,
				properties: {
					type: {
						type: ['string', 'null'],
						enum: ACCOUNT_TYPES,
						description: 'Account type to get balance for.  e.g. "spot" or "future".  Defaults to "spot".',
					},
					currency: {
						type: ['string', 'null'],
						description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getCurrencyMarkets',
			description: 'Get a list of all active markets (also called trading pairs) that include the given currency or token.  Returns a list of market symbols.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['currency'],
				additionalProperties: false,
				properties: {
					currency: {
						type: 'string',
						description: 'Currency to get markets for, e.g. "BTC"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getMarketInfo',
			description:
				'Get price and volume information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Symbol of the market to get information for, for example "BTC/USDT"',
					},
				},
			},
		},
	},
] satisfies AdapterExport['tools'];
