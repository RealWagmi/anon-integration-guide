import { AdapterExport } from '@heyanon/sdk';
import { ACCOUNT_TYPES, MAX_MARKETS_IN_RESULTS, MAX_ORDERS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS } from './constants';

const SIDE_DESCRIPTION = 'Side of the order, either "long" or "short".  Long and short are ALWAYS relative to the FIRST (base) currency in the market symbol.';

const MARKET_DESCRIPTION =
	'Symbol of the market to trade, e.g. "BTC/USDT:USDT".  The FIRST (base) currency is the asset you are actually longing (side = "long") or shorting (side = "short")';

const AMOUNT_DESCRIPTION = [
	'Amount is the FINAL trade size after leverage (total notional to transact), not margin. Do NOT scale, prorate, or recalc it by leverage or price.',
	'User always provides the final size. You must pass it as-is using the correct "amountCurrency" value.',
	'amountCurrency:',
	'• BASE — the first currency of the market symbol (e.g., BTC in BTC/USDT). If the user gives a BASE amount, use it directly as the trade size in BASE.',
	'• QUOTE — the second currency of the market symbol (e.g., USDT in BTC/USDT). If the user gives a QUOTE amount, use it directly as the trade size in QUOTE notional. For QUOTE, USD / $ / USDT / USDC are treated the same (USD = USDT/USDC).',
	'Do NOT convert between BASE and QUOTE.',
].join('\n');

export const tools = [
	{
		type: 'function',
		function: {
			name: 'createSimpleOrder',
			description: [
				'Create an order that is activated immediately, without a trigger attached to it. The order will execute at the current market price or a specified limit price. The leverage and margin mode for the order are the user-configured leverage and margin mode for the market.',
			].join('\n'),
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
						enum: ['long', 'short'],
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
			description: [
				'Create an order that is activated only after the given price condition is met. Once activated, the order will be executed at either the current market price or a specified limit price. The leverage and margin mode for the order are the user-configured leverage and margin mode for the market.',
			].join('\n'),
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'triggerPrice', 'limitPrice', 'reduceOnly'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['long', 'short'],
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
					reduceOnly: {
						type: ['boolean', 'null'],
						description: 'If true, the order will either close a position or reduce its size.  Defaults to false.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'createTrailingStopOrder',
			description: [
				'Create a trailing stop order, that is, an order that is executed only when the price moves a certain percentage away from the entry price. The order will execute immediately as a market order when triggered.',
			].join('\n'),
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'side', 'amount', 'amountCurrency', 'trailingPercent', 'limitPrice', 'triggerPrice', 'reduceOnly'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: MARKET_DESCRIPTION,
					},
					side: {
						type: 'string',
						enum: ['long', 'short'],
						description: SIDE_DESCRIPTION,
					},
					amount: {
						type: 'number',
						description: AMOUNT_DESCRIPTION + 'The amount for this order (trailing stop order) is always specified in the base currency.',
					},
					amountCurrency: { type: 'string', enum: ['BASE', 'QUOTE'], description: 'Specifies whether the amount is denominated in base currency or quote currency' },
					trailingPercent: {
						type: 'number',
						description: 'Percentage change in price required to trigger order entry, expressed as a number between 0 and 100.',
					},
					limitPrice: {
						type: ['number', 'null'],
						description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  Leave blank for a market order.',
					},
					triggerPrice: {
						type: ['number', 'null'],
						description: 'Price at which the order will be activated, defaults to the current market price.',
					},
					reduceOnly: {
						type: ['boolean', 'null'],
						description: 'If true, the order will either close a position or reduce its size.  Defaults to false.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'closePosition',
			description: 'Close a position by sending an opposite market order',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'setLeverage',
			description: 'Set the user configured leverage for a specific market',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'leverage'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
					leverage: {
						type: 'number',
						description: 'Leverage to set, e.g. 10 for 10x, 50 for 50x, etc.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'setMarginMode',
			description: 'Set the user configured margin mode for a specific market',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'marginMode'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
					marginMode: {
						type: 'string',
						enum: ['isolated', 'cross'],
						description: 'Margin mode to set, either "isolated" or "cross"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'addMarginToIsolatedPosition',
			description: 'Add margin to an isolated margin position',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'amount'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
					amount: {
						type: 'number',
						description: 'Amount to add',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'reduceMarginFromIsolatedPosition',
			description: 'Reduce margin from an isolated margin position',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market', 'amount'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
					amount: {
						type: 'number',
						description: 'Amount to reduce',
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
			name: 'getPositions',
			description: `Show the user's most recent ${MAX_POSITIONS_IN_RESULTS} open positions, including notional, margin, and PnL.`,
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
			name: 'getPositionOnMarket',
			description: `Show information on the position held by the user on the given market, including notional, margin, and PnL.  If you only have the currency, use getPositions and filter by currency.`,
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Symbol of the market to get position for, e.g. "BTC/USDT:USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getOpenOrders',
			description: `Show the user's most recent ${MAX_ORDERS_IN_RESULTS} open orders`,
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
			description:
				'Show information about a specific order by ID and market symbol.  If the market is not specified, fetch all orders and filter by ID, without asking for confirmation.',
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
						description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT:USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getBalance',
			description: 'Get user futures balance.  This does not include open positions.  For each currency, show how much is available to trade (free).',
			strict: true,
			parameters: {
				type: 'object',
				required: ['type', 'currency'],
				additionalProperties: false,
				properties: {
					type: {
						type: ['string', 'null'],
						enum: ACCOUNT_TYPES,
						description: 'Account type to get balance for.  Defaults to "future".',
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
			description: `Show active markets (also called trading pairs) with the given currency or token.  For each market, show the maximum leverage allowed.  Show only the first ${MAX_MARKETS_IN_RESULTS} markets.`,
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
				'Get price, volume and max leverage information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Symbol of the market to get information for, for example "BTC/USDT:USDT"',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getUserLeverageAndMarginModeOnMarket',
			description: 'Get the user configured leverage (10x, 50x, etc) and margin mode (isolated, cross) for a specific market',
			strict: true,
			parameters: {
				type: 'object',
				required: ['market'],
				additionalProperties: false,
				properties: {
					market: {
						type: 'string',
						description: 'Market symbol, e.g. "BTC/USDT:USDT"',
					},
				},
			},
		},
	},
] satisfies AdapterExport['tools'];
