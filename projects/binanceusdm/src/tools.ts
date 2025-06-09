import { AiTool } from '@heyanon/sdk';
import { ACCOUNT_TYPES, MAX_MARKETS_IN_RESULTS, MAX_ORDERS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS } from './constants';

const SIDE_DESCRIPTION = 'Side of the order, either "long" or "short".  Long and short are ALWAYS relative to the FIRST (base) currency in the market symbol.';

const MARKET_DESCRIPTION =
    'Symbol of the market to trade, e.g. "BTC/USDT:USDT".  The FIRST (base) currency is the asset you are actually longing (side = "long") or shorting (side = "short")';

const MARGIN_CALCULATION_INSTRUCTIONS = [
    'IMPORTANT: When the user specifies margin amount (e.g., "with X USDT at Nx leverage"), you must:',
    '1. Use getMarketInfo to get the current price',
    '2. Calculate position size as: (margin_amount * leverage) / current_price',
    '3. Use the calculated amount in base currency for this order',
    'For the purpose of margin calculation, assume that $1 = 1 USDT = 1 USDC',
].join('\n');

const AMOUNT_DESCRIPTION = [
    'Amount to trade. This can be specified in two ways:',
    '1. Direct base currency amount: e.g., "1 SOL" means trade exactly 1 SOL',
    '2. Margin-based sizing: e.g., "5 USDT at 30x leverage" means use 5 USDT as margin to open a position worth 150 USDT (5 * 30x)',
    '',
    'When the user specifies an amount in the quote currency (e.g., "with 5 USDT"), first get the current market price using getMarketInfo, then calculate the base currency amount as: (margin_amount * leverage) / current_price',
    '',
    'Always return the amount in BASE currency (the FIRST currency in the market symbol).',
].join('\n');

export const tools: AiTool[] = [
    {
        name: 'createSimpleOrder',
        description: [
            'Create an order that is activated immediately, without a trigger attached to it. The order will execute at the current market price or a specified limit price. The leverage and margin mode for the order are the user-configured leverage and margin mode for the market.',
            '',
            MARGIN_CALCULATION_INSTRUCTIONS,
        ].join('\n'),
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
                enum: ['long', 'short'],
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
        description: [
            'Create an order that is activated only after the given price condition is met. Once activated, the order will be executed at either the current market price or a specified limit price. The leverage and margin mode for the order are the user-configured leverage and margin mode for the market.',
            '',
            MARGIN_CALCULATION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'side', 'amount', 'triggerPrice', 'limitPrice', 'reduceOnly'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: MARKET_DESCRIPTION,
            },
            {
                name: 'side',
                type: 'string',
                enum: ['long', 'short'],
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
            {
                name: 'reduceOnly',
                type: ['boolean', 'null'],
                description: 'If true, the order will either close a position or reduce its size.  Defaults to false.',
            },
        ],
    },
    {
        name: 'createTrailingStopOrder',
        description: [
            'Create a trailing stop order, that is, an order that is executed only when the price moves a certain percentage away from the entry price. The order will execute immediately as a market order when triggered.',
            '',
            MARGIN_CALCULATION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'side', 'amount', 'trailingPercent', 'limitPrice', 'triggerPrice', 'reduceOnly'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: MARKET_DESCRIPTION,
            },
            {
                name: 'side',
                type: 'string',
                enum: ['long', 'short'],
                description: SIDE_DESCRIPTION,
            },
            {
                name: 'amount',
                type: 'number',
                description: AMOUNT_DESCRIPTION,
            },
            {
                name: 'trailingPercent',
                type: 'number',
                description: 'Percentage change in price required to trigger order entry, expressed as a number between 0 and 100.',
            },
            // Here we are cheating a bit.  Binance Futures does not support limit price
            // for trailing stop orders, but we are not telling the LLM that.  It will
            // just try to use the limitPrice parameter and get an error, instead of
            // trying a weird combination of orders to achieve the limit order request.
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  Leave blank for a market order.',
            },
            {
                name: 'triggerPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be activated, defaults to the current market price.',
            },
            {
                name: 'reduceOnly',
                type: ['boolean', 'null'],
                description: 'If true, the order will either close a position or reduce its size.  Defaults to false.',
            },
        ],
    },
    {
        name: 'closePosition',
        description: 'Close a position by sending an opposite market order',
        required: ['market'],
        props: [{ name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' }],
    },
    {
        name: 'setLeverage',
        description: 'Set the user configured leverage for a specific market',
        required: ['market', 'leverage'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Market symbol, e.g. "BTC/USDT:USDT"',
            },
            {
                name: 'leverage',
                type: 'number',
                description: 'Leverage to set, e.g. 10 for 10x, 50 for 50x, etc.',
            },
        ],
    },
    {
        name: 'setMarginMode',
        description: 'Set the user configured margin mode for a specific market',
        required: ['market', 'marginMode'],
        props: [
            { name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' },
            { name: 'marginMode', type: 'string', enum: ['isolated', 'cross'], description: 'Margin mode to set, either "isolated" or "cross"' },
        ],
    },
    {
        name: 'addMarginToIsolatedPosition',
        description: 'Add margin to an isolated margin position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' },
            { name: 'amount', type: 'number', description: 'Amount to add' },
        ],
    },
    {
        name: 'reduceMarginFromIsolatedPosition',
        description: 'Reduce margin from an isolated margin position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' },
            { name: 'amount', type: 'number', description: 'Amount to reduce' },
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
        name: 'getPositions',
        description: `Show the user's most recent ${MAX_POSITIONS_IN_RESULTS} open positions, including notional, margin, and PnL.`,
        required: [],
        props: [],
    },
    {
        name: 'getPositionOnMarket',
        description: `Show information on the position held by the user on the given market, including notional, margin, and PnL.  If you only have the currency, use getPositions and filter by currency.`,
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to get position for, e.g. "BTC/USDT:USDT"',
            },
        ],
    },
    {
        name: 'getOpenOrders',
        description: `Show the user's most recent ${MAX_ORDERS_IN_RESULTS} open orders`,
        required: [],
        props: [],
    },
    {
        name: 'getOrderByIdAndMarket',
        description:
            'Show information about a specific order by ID and market symbol.  If the market is not specified, fetch all orders and filter by ID, without asking for confirmation.',
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
                description: 'Symbol of the market the order belongs to, e.g. "BTC/USDT:USDT"',
            },
        ],
    },
    {
        name: 'getBalance',
        description: 'Get user futures balance.  This does not include open positions.  For each currency, show how much is available to trade (free).',
        required: ['type', 'currency'],
        props: [
            {
                name: 'type',
                type: ['string', 'null'],
                enum: ACCOUNT_TYPES,
                description: 'Account type to get balance for.  Defaults to "future".',
            },
            { name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' },
        ],
    },
    {
        name: 'getCurrencyMarkets',
        description: `Show active markets (also called trading pairs) with the given currency or token.  For each market, show the maximum leverage allowed.  Show only the first ${MAX_MARKETS_IN_RESULTS} markets.`,
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
            'Get price, volume and max leverage information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to get information for, for example "BTC/USDT:USDT"',
            },
        ],
    },
    {
        name: 'getUserLeverageAndMarginModeOnMarket',
        description: 'Get the user configured leverage (10x, 50x, etc) and margin mode (isolated, cross) for a specific market',
        required: ['market'],
        props: [{ name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' }],
    },
];
