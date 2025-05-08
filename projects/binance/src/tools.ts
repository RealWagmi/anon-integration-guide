import { AiTool } from '@heyanon/sdk';
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
    'Amount of BASE currency (i.e. the FIRST currency in the market symbol) to buy or sell.',
    '',
    'If the user gives the amount in the QUOTE currency (second currency) or expresses it as "spend all my Y" where Y is the quote currency, follow this procedure:',
    '1. Use getBalance to determine the available amount of the quote currency.',
    '2. Use getMarketInfo to fetch the up-to-date price for the chosen market.',
    '3. Compute baseAmount = quoteAmount / price.',
    '4. Provide this baseAmount as the value for the amount field.',
    '',
    'Never pass the quote-currency amount directly; the amount must always be in base-currency units.',
].join(' ');

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
                description: MARKET_DESCRIPTION,
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
                description: AMOUNT_DESCRIPTION,
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
                description: MARKET_DESCRIPTION,
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
                description: AMOUNT_DESCRIPTION,
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
                description: MARKET_DESCRIPTION,
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
                description: AMOUNT_DESCRIPTION,
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
                description: MARKET_DESCRIPTION,
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
                description: AMOUNT_DESCRIPTION,
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
        name: 'transferFunds',
        description: 'Transfer funds between accounts of the same user, e.g. from spot to future account',
        required: ['currency', 'amount', 'from', 'to'],
        props: [
            { name: 'currency', type: 'string', description: 'Currency to transfer, e.g. "USDT"' },
            { name: 'amount', type: 'number', description: 'Amount to transfer' },
            {
                name: 'from',
                type: ['string', 'null'],
                enum: ACCOUNT_TYPES,
                description: 'Account to transfer from.  e.g. "spot" or "future".  Defaults to "spot" or "future".',
            },
            { name: 'to', type: 'string', enum: ACCOUNT_TYPES, description: 'Account to transfer to.  e.g. "spot" or "future"' },
        ],
    },
    {
        name: 'getOpenOrders',
        description: `Show the most recent ${MAX_ORDERS_IN_RESULTS} open orders`,
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
        description: 'Get user balance.  For each currency, also show how much is available to trade (free).',
        required: ['type', 'currency'],
        props: [
            { name: 'type', type: ['string', 'null'], enum: ACCOUNT_TYPES, description: 'Account type to get balance for.  e.g. "spot" or "future".  Defaults to "spot".' },
            { name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' },
        ],
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
            'Get price and volume information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
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
