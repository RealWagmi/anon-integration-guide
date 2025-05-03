import { AiTool } from '@heyanon/sdk';
import { MAX_ORDERS_IN_RESULTS, MAX_TRAILING_DELTA, MIN_TRAILING_DELTA } from './constants';

const SIDE_DESCRIPTION =
    'Side of the order, either "buy" or "sell".  If the market is BTC/USDT, then the side is "buy" if the user wants to buy BTC and "sell" if the user wants to sell BTC.';

export const tools: AiTool[] = [
    {
        name: 'createSimpleOrder',
        description:
            'Create an order that is activated immediately, without a trigger attached to it.  The order will execute at the current market price or a specified limit price.',
        required: ['market', 'side', 'amount', 'limitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to trade, for example "BTC/USDT"',
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: SIDE_DESCRIPTION,
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  Leave blank for a market order.',
            },
        ],
    },
    {
        name: 'createTriggerOrder',
        description:
            'Create an order that is activated only after the given price condition is met. Once activated, the order will be executed at either the current market price or a specified limit price.',
        required: ['market', 'side', 'amount', 'triggerPrice', 'limitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to trade, for example "BTC/USDT"',
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: SIDE_DESCRIPTION,
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  If not specified, the order will be a market order.',
            },
            {
                name: 'triggerPrice',
                type: 'number',
                description: 'Price at which the order will be activated',
            },
        ],
    },
    {
        name: 'createTakeProfitStopLossOrder',
        description: 'Create take profit and/or stop loss orders.  If both are provided, they will be created as an OCO (one-cancels-the-other) order.',
        required: ['market', 'side', 'amount', 'takeProfitTriggerPrice', 'takeProfitLimitPrice', 'stopLossTriggerPrice', 'stopLossLimitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to trade, for example "BTC/USDT"',
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: SIDE_DESCRIPTION,
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'takeProfitTriggerPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the take profit order will be activated.  For sell orders, must be higher than stop loss trigger price.  For buy orders, must be lower than stop loss trigger price.  If not specified, the take profit order will not be created.',
            },
            {
                name: 'takeProfitLimitPrice',
                type: ['number', 'null'],
                description: 'Price at which the take profit order will be executed.  If not specified, the order will be a market order.',
            },
            {
                name: 'stopLossTriggerPrice',
                type: ['number', 'null'],
                description: 'Price at which the stop loss order will be activated.  If not specified, the stop loss order will not be created.',
            },
            {
                name: 'stopLossLimitPrice',
                type: ['number', 'null'],
                description: 'Price at which the stop loss order will be executed.  If not specified, the order will be a market order.',
            },
        ],
    },
    {
        name: 'createTrailingStopOrder',
        description: 'Create a trailing stop order.  The order can be either a stop loss or take profit.',
        required: ['market', 'side', 'amount', 'stopLossOrTakeProfit', 'trailingDelta', 'limitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to trade, for example "BTC/USDT"',
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: SIDE_DESCRIPTION,
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'stopLossOrTakeProfit',
                type: 'string',
                enum: ['STOP_LOSS', 'TAKE_PROFIT', 'NOT_SPECIFIED'],
                description: 'Whether to create a STOP LOSS or TAKE PROFIT order.  If it is not 100% clear what the user wants, leave blank.',
            },
            {
                name: 'trailingDelta',
                type: 'number',
                description: `Percentage change in price required to trigger order entry, expressed in BIPS (100 BIPS = 1%).  Must be between ${MIN_TRAILING_DELTA} and ${MAX_TRAILING_DELTA}.`,
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the order will be executed, after the trailing stop is triggered.  Include only if explicitly specified by the user.  If not specified, the order will be a market order.',
            },
        ],
    },
    {
        name: 'cancelOrderByIdAndMarket',
        description: 'Cancel a specific order by ID and market symbol.  If you only have the order ID, use getOpenOrders to get the market symbol.',
        required: ['id', 'market'],
        props: [
            {
                name: 'id',
                type: 'string',
                description: 'Order ID to cancel',
            },
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT"',
            },
        ],
    },
    {
        name: 'cancelAllOrdersOnMarket',
        description: 'Cancel all open orders on a given market',
        required: ['market'],
        props: [{ name: 'market', type: 'string', description: 'Symbol of the market to cancel orders on, e.g. "BTC/USDT"' }],
    },
    {
        name: 'getOpenOrders',
        description: `Show the most recent ${MAX_ORDERS_IN_RESULTS} open orders.  For each order, show: order ID, timestamp, market symbol, type, side, price, amount, amount filled, and status.`,
        required: [],
        props: [],
    },
    {
        name: 'getOrderByIdAndMarket',
        description: 'Get information about a specific order by ID and market symbol',
        required: ['id', 'market'],
        props: [
            {
                name: 'id',
                type: 'string',
                description: 'Order ID to get information for',
            },
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT"',
            },
        ],
    },
    {
        name: 'getBalance',
        description: 'Get balance for all currencies/tokens that the user owns on the exchange.  For each currency, also show how much is available to trade (free).',
        required: ['currency'],
        props: [{ name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' }],
    },
    {
        name: 'getCurrencyMarkets',
        description: 'Get a list of all active markets (also called trading pairs) that include the given currency or token.  Returns a list of market symbols.',
        required: ['currency'],
        props: [
            {
                name: 'currency',
                type: 'string',
                description: 'Currency to get markets for, e.g. "BTC"',
            },
        ],
    },
    {
        name: 'getMarketInfo',
        description:
            'Get information about a specific market (also called a trading pair), most importantly: last price, bid price, ask price, 24h volume, and more.  Prices are in quote currency.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to get information for, for example "BTC/USDT"',
            },
        ],
    },
];
