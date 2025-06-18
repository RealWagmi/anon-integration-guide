import { AiTool } from '@heyanon/sdk';
import { MARGIN_MODES, MAX_MARKETS_IN_RESULTS, MAX_ORDERS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS } from './constants';
import { SUPPORTED_MARKET_TYPES } from './helpers/exchange';

/**
 * Order creation tools need to know the market type (spot,
 * perpetual, delivery)
 */
const MARKET_TYPE_PARAMETER = {
    name: 'marketType',
    type: 'string',
    description: [
        'Market type. Inference rules:',
        '- "buy"/"sell" → spot market',
        '- "long"/"short" → perpetual market (default for futures)',
        '- Delivery dates mentioned → delivery market',
        'Only ask for clarification if genuinely ambiguous.',
    ].join(' '),
    enum: SUPPORTED_MARKET_TYPES,
};

/**
 * Description of the side parameter, to be included in all order
 * creation tools.
 */
const SIDE_DESCRIPTION = [
    'Side of the order, either "buy", "sell", "long" or "short".  The side is ALWAYS relative to the FIRST (base) currency in the market symbol.',
    '',
    'The behavior of the side is different for spot and futures (that is, perpetual and delivery) markets:',
    '- For spot markets, the side is always "buy" or "sell".',
    "- For futures markets, the side is always 'long' or 'short'.  When longing or shorting, if the leverage is not specified, the user-configured leverage for the market will be automatically used.",
].join('\n');

/**
 * Description of the market parameter, to be included in all tools
 * that work for both spot and futures markets.
 */
const MARKET_DESCRIPTION = [
    'Symbol of the market.  The type of the market can be inferred from the symbol:',
    '- Spot markets symbols have the form "BTC/USDT", where the FIRST currency is the base currency and the SECOND currency is the quote currency.',
    '- Perpetual markets symbols have the form "BTC/USDT:USDT", where the THIRD currency is the settlement currency.',
    '- Delivery markets (also known as expiry markets) symbols have the form "BTC/USD:BTC-250926", where the LAST part of the symbol is the expiry date of the contract.',
].join(' ');

/**
 * Description of the market parameter, to be included in all tools
 * that work for futures markets (that is, perpetual and delivery).
 */
const FUTURES_MARKET_DESCRIPTION = ['Futures market symbol, e.g. "BTC/USDT:USDT" or "BTC/USDT:USDT-250926"'].join('\n');

/**
 * Instructions for the market type inference to be included in the description
 * of the create orders tools
 */
const MARKET_TYPE_INSTRUCTIONS = [
    'Market type defaults:',
    '- Long/short orders default to PERPETUAL markets',
    '- Buy/sell orders default to SPOT markets',
    '- Only use DELIVERY markets when explicitly mentioned or when an expiry date is mentioned',
].join('\n');

/**
 * Allow the user to specify the order size by specifying the quote currency amount for spot markets
 */
const SPOT_QUOTE_CURRENCY_INSTRUCTIONS = [
    'For spot markets, when the user specifies "with X [quote currency]" (e.g., "with 10000 USDT"), this means they want to spend that amount of quote currency. You must:',
    '1. If a limit price is provided, use that price for calculation',
    '2. If no limit price is provided, use getMarketInfo to get the current price',
    '3. Calculate the base currency amount as: quote_currency_amount / price',
    '4. Use the calculated amount in base currency for this order',
    'Example: "Buy BTC at 50000 with 10000 USDT" means buy 0.2 BTC (10000 / 50000 = 0.2)',
].join('\n');

/**
 * Allow the user to specify the order size by specifying the margin amount
 */
const MARGIN_CALCULATION_INSTRUCTIONS = [
    'CRITICAL: For perpetual and delivery markets, when the user specifies "with X USDT" or "with X USDC", this ALWAYS means margin amount, NOT the total position value.',
    '',
    'You MUST follow these steps:',
    '1. Identify the margin amount from the prompt (e.g., "with 100 USDT" means margin = 100)',
    '2. Get the price: use the limit price if provided, otherwise get the price from tool getMarketInfo',
    '3. Get the leverage: if not specified in the prompt, you MUST call getUserLeverageOnMarket first',
    '4. Calculate: base_amount = (margin × leverage) ÷ price',
    '',
    'LEVERAGE REQUIREMENT:',
    '- If prompt mentions leverage (e.g., "50x", "at 10x leverage"), use that value',
    '- If NO leverage mentioned, you MUST call getUserLeverageOnMarket before calculating',
    '- NEVER assume default leverage values without calling the tool',
    '',
    'Example: "Long BTC at 50000 with 100 USDT" with 50x leverage:',
    '- Margin = 100 USDT',
    '- Price = 50,000 USDT',
    '- Leverage = 50x (obtained from getUserLeverageOnMarket)',
    '- Base amount = (100 × 50) ÷ 50,000 = 0.1 BTC',
    '',
    'NEVER treat "with X USDT" as a spot-style calculation for futures markets!',
].join('\n');

/**
 * Description of the amount parameter, to be included in all order
 * creation tools, taking into account that the user can specify the
 * order size by specifying the margin amount.
 */
const AMOUNT_DESCRIPTION = [
    'Amount to trade in BASE currency (the FIRST currency in the market symbol).',
    '',
    'CRITICAL DISTINCTION:',
    '- For SPOT markets: "with X USDT" = spend X USDT (divide by price)',
    '- For FUTURES markets: "with X USDT" = use X USDT as MARGIN (multiply by leverage, then divide by price)',
    '',
    'For SPOT markets:',
    '1. Direct: "buy 1 BTC" → amount = 1',
    '2. Quote spending: "buy BTC with 10000 USDT" → amount = 10000 / price',
    '',
    'For FUTURES markets (MUST apply leverage):',
    '1. Direct: "long 1 BTC" → amount = 1',
    '2. Margin-based: "long BTC with 100 USDT" → amount = (100 × leverage) / price',
    '   Example: 100 USDT margin, 50x leverage, 50000 price → (100 × 50) / 50000 = 0.1 BTC',
    '',
    'If the prompt includes "long" or "short", you MUST use the futures calculation with leverage.',
    'Always return the amount in BASE currency.',
].join('\n');

export const tools: AiTool[] = [
    {
        name: 'createSimpleOrder',
        description: [
            'Create an order that is activated immediately, without a trigger attached to it. The order will execute at the current market price or a specified limit price.',
            '',
            MARKET_TYPE_INSTRUCTIONS,
            '',
            SPOT_QUOTE_CURRENCY_INSTRUCTIONS,
            '',
            MARGIN_CALCULATION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'marketType', 'side', 'amount', 'limitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: MARKET_DESCRIPTION,
            },
            MARKET_TYPE_PARAMETER,
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell', 'long', 'short'],
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
        name: 'closePosition',
        description: 'Close a futures position by sending an opposite market order',
        required: ['market'],
        props: [{ name: 'market', type: 'string', description: FUTURES_MARKET_DESCRIPTION }],
    },
    {
        name: 'setUserMarginMode',
        description: "Set the margin mode for the user account.  This will change the margin mode for all of the user's open positions.",
        required: ['marginMode'],
        props: [
            {
                name: 'marginMode',
                type: 'string',
                description: `Margin mode to set`,
                enum: MARGIN_MODES,
            },
        ],
    },
    {
        name: 'setUserLeverageOnMarket',
        description:
            'Set the user configured leverage for a specific futures market.  The function will automatically check the current leverage and only set it if it is different from the requested leverage.',
        required: ['market', 'leverage'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
            },
            {
                name: 'leverage',
                type: 'number',
                description: 'Leverage to set, e.g. 10 for 10x, 50 for 50x, etc.',
            },
        ],
    },
    {
        name: 'addMarginToPosition',
        description: 'Add margin to an existing futures position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: FUTURES_MARKET_DESCRIPTION },
            { name: 'amount', type: 'number', description: 'Amount to add' },
        ],
    },
    {
        name: 'reduceMarginFromPosition',
        description: 'Reduce margin from an existing futures position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: FUTURES_MARKET_DESCRIPTION },
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
                description: MARKET_DESCRIPTION,
            },
        ],
    },
    {
        name: 'cancelAllOrdersOnMarket',
        description: 'Cancel all open orders on a given market.  Before executing the tool, always get the open orders to make sure you are cancelling the correct orders.',
        required: ['market'],
        props: [{ name: 'market', type: 'string', description: MARKET_DESCRIPTION }],
    },
    {
        name: 'getPositions',
        description: `Show the user's most recent ${MAX_POSITIONS_IN_RESULTS} open positions on future markets, including notional, margin, and PnL.`,
        required: [],
        props: [],
    },
    {
        name: 'getPositionOnMarket',
        description: `Show all details on the futures position held by the user on the given future market.  If you only have the currency, use getPositions and filter by currency.`,
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
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
                description: MARKET_DESCRIPTION,
            },
        ],
    },
    {
        name: 'getBalance',
        description: 'Get the unified user balance.  This does not include open positions.  For each currency, show how much is available to trade (free).',
        required: ['currency'],
        props: [{ name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' }],
    },
    {
        name: 'getCurrencyMarketsOfGivenType',
        description: `Show active markets (also called trading pairs) with the given currency or token.  Show only the first ${MAX_MARKETS_IN_RESULTS} markets.  If the user asks for future markets, the function should be called for both perpetual and delivery markets.`,
        required: ['marketType', 'currency'],
        props: [
            {
                name: 'marketType',
                type: 'string',
                description: `Market type`,
                enum: SUPPORTED_MARKET_TYPES,
            },
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
            'Get price, volume and leverage information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: MARKET_DESCRIPTION,
            },
        ],
    },
    {
        name: 'getUserMarginMode',
        description: 'Get the user configured margin mode (set at the account level)',
        required: [],
        props: [],
    },
    {
        name: 'getUserLeverageOnMarket',
        description: 'Get the user configured leverage for the given futures market',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
            },
        ],
    },
];
