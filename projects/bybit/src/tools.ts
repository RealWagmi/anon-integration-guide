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
 * Market types available for tools that work only with futures markets (perpetual and delivery)
 */
const MARKET_TYPE_PARAMETER_FUTURES_ONLY = {
    name: 'marketType',
    type: 'string',
    description: 'Market type (only futures markets are supported)',
    enum: [...SUPPORTED_MARKET_TYPES].filter((type) => type === 'perpetual' || type === 'delivery'),
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
    "- For futures markets, the side is always 'long' or 'short'.  If the leverage is not specified, the user-configured leverage for the market will be automatically used.",
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
 * that work only for futures markets (that is, perpetual and delivery).
 */
const FUTURES_MARKET_DESCRIPTION = ['Futures market symbol, e.g. "BTC/USDT:USDT" or "BTC/USDT:USDT-250926"'].join('\n');

/**
 * Description of the market parameter, to be included in all tools
 * that work only for spot markets
 */
const SPOT_MARKET_DESCRIPTION = ['Spot market symbol, e.g. "BTC/USDT"'].join('\n');

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
 * General instructions for handling futures positions (long/short orders)
 */
const FUTURES_POSITION_INSTRUCTIONS = [
    'CRITICAL PREREQUISITES FOR FUTURES POSITIONS:',
    '',
    'MARGIN MODE HANDLING:',
    '- If the user specifies a margin mode (e.g., "isolated", "cross"), ALWAYS call setUserMarginMode FIRST',
    '- If setUserMarginMode fails, DO NOT proceed with position creation - explain the error to the user',
    '- NEVER create a position in a different margin mode than the user requested',
    '',
    'LEVERAGE HANDLING:',
    '- If leverage is specified in the prompt (e.g., "10x", "with 50x leverage"), ALWAYS call setUserLeverageOnMarket FIRST',
    '- If setUserLeverageOnMarket fails, DO NOT proceed with position creation - explain the error to the user',
    "- If leverage is NOT specified, proceed without setting it (the user's current leverage will be used)",
    '',
    'IMPORTANT: Both margin mode and leverage settings are BLOCKING operations. If either fails, you MUST:',
    '1. Stop immediately',
    '2. Explain the error to the user',
    '3. Ask the user how they want to proceed',
    '4. DO NOT create any position until these prerequisites are successfully met',
].join('\n');

/**
 * Description of the amount parameter
 */
const AMOUNT_DESCRIPTION = 'Amount to trade (in either base or spend currency, as specified by amountCurrency parameter)';

/**
 * Description of the amountCurrency parameter
 */
const AMOUNT_CURRENCY_DESCRIPTION = [
    'Currency type for the amount parameter:',
    '- "base": Amount is in base currency (e.g., "1 BTC")',
    '- "spend": Amount is in spend/margin currency (e.g., "100 USDT")',
    '',
    'Inference rules:',
    '- Direct amounts like "1 BTC" → use "base"',
    '- "with X USDT" or "spend X USDT" → use "spend"',
].join('\n');

/**
 * Standard amountCurrency parameter to be used in order creation tools
 */
const AMOUNT_CURRENCY_PARAMETER = {
    name: 'amountCurrency',
    type: 'string',
    enum: ['base', 'spend'],
    description: AMOUNT_CURRENCY_DESCRIPTION,
};

export const tools: AiTool[] = [
    {
        name: 'createSimpleOrder',
        description: [
            'Create an order that is activated immediately, without a trigger attached to it. The order will execute at the current market price or a specified limit price.',
            '',
            MARKET_TYPE_INSTRUCTIONS,
            '',
            FUTURES_POSITION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'marketType', 'side', 'amount', 'amountCurrency', 'limitPrice'],
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
            AMOUNT_CURRENCY_PARAMETER,
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  Leave blank for a market order.',
            },
        ],
    },
    {
        name: 'createConditionalOrder',
        description: [
            'Create an order that is activated only after the given price condition is met, and does not utilize your balance until triggered. Once activated, the order will be executed at either the current market price or a specified limit price.  On spot markets, this tool can be used to place TP and SL orders in absence of an entry order.',
            '',
            MARKET_TYPE_INSTRUCTIONS,
            '',
            FUTURES_POSITION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'marketType', 'side', 'amount', 'amountCurrency', 'triggerPrice', 'limitPrice'],
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
            AMOUNT_CURRENCY_PARAMETER,
            {
                name: 'triggerPrice',
                type: 'number',
                description: 'Price at which the order will be activated',
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  Include only if explicitly specified by the user.  If not specified, the order will be a market order.',
            },
        ],
    },
    {
        name: 'createSpotTakeProfitAndOrStopLossOrder',
        description: [
            'Create ONLY conditional TP/SL orders (no immediate buy/sell). These are standalone orders that trigger at specified prices.',
            '',
            'USE THIS TOOL WHEN user wants ONLY TP/SL orders:',
            '- "Set a 10% TP and 15% SL to buy 1 BTC" (creates conditional buy orders)',
            '- "Set stop loss at $60k to sell my BTC" (creates conditional sell order)',
            '- "Place take profit at $4000 to sell ETH" (creates conditional sell order)',
            '- "Create TP/SL orders to buy back ETH at better prices" (creates conditional buy orders)',
            '',
            'DO NOT USE when user wants IMMEDIATE execution + TP/SL:',
            '- "Buy 1 BTC now with stop loss" → Use createSpotEntryOrderWithTakeProfitAndOrStopLossAttached',
            '- "Sell ETH at market with take profit" → Use createSpotEntryOrderWithTakeProfitAndOrStopLossAttached',
            '',
            'Key difference: This tool creates WAITING orders, not immediate trades',
        ].join('\n'),
        required: ['market', 'side', 'amount', 'takeProfitTriggerPrice', 'takeProfitType', 'takeProfitLimitPrice', 'stopLossTriggerPrice', 'stopLossType', 'stopLossLimitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: SPOT_MARKET_DESCRIPTION,
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Side of the order',
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
                    'Price at which the take profit order will be activated. Can be specified as absolute price or percentage. For sell orders, must be higher than stop loss trigger price. For buy orders, must be lower than stop loss trigger price. If not specified, the take profit order will not be created.',
            },
            {
                name: 'takeProfitType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether takeProfitTriggerPrice is an absolute price or a percentage from current/limit price.',
            },
            {
                name: 'takeProfitLimitPrice',
                type: ['number', 'null'],
                description: 'Price at which the take profit order will be executed.  If not specified, the order will be a market order.',
            },
            {
                name: 'stopLossTriggerPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the stop loss order will be activated. Can be specified as absolute price or percentage. If not specified, the stop loss order will not be created.',
            },
            {
                name: 'stopLossType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether stopLossTriggerPrice is an absolute price or a percentage from current/limit price.',
            },
            {
                name: 'stopLossLimitPrice',
                type: ['number', 'null'],
                description: 'Price at which the stop loss order will be executed.  If not specified, the order will be a market order.',
            },
        ],
    },
    {
        name: 'createPositionWithTakeProfitAndOrStopLossOrderAttached',
        description: [
            'Create a futures position with take profit and/or stop loss orders attached to it.   Use this tool ONLY if the user explicitly specifies take profit and/or stop loss targets.  If no TP/SL is specified, use createSimpleOrder instead.',
            '',
            FUTURES_POSITION_INSTRUCTIONS,
        ].join('\n'),
        required: ['market', 'marketType', 'side', 'amount', 'amountCurrency', 'takeProfitPrice', 'takeProfitType', 'stopLossPrice', 'stopLossType', 'limitPrice', 'reduceOnly'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
            },
            MARKET_TYPE_PARAMETER_FUTURES_ONLY,
            {
                name: 'side',
                type: 'string',
                enum: ['long', 'short'],
                description: 'Side of the order',
            },
            {
                name: 'amount',
                type: 'number',
                description: AMOUNT_DESCRIPTION,
            },
            AMOUNT_CURRENCY_PARAMETER,
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the position will be opened.  Include only if explicitly specified by the user.  Leave blank for a market order.',
            },
            {
                name: 'takeProfitPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the take profit order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided.',
            },
            {
                name: 'takeProfitType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether takeProfitPrice is an absolute price or a percentage from current/limit price.',
            },
            {
                name: 'stopLossPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the stop loss order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided.',
            },
            {
                name: 'stopLossType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether stopLossPrice is an absolute price or a percentage from current/limit price.',
            },
            {
                name: 'reduceOnly',
                type: ['boolean', 'null'],
                description: 'If true, the order will either close a position or reduce its size.  Defaults to false.',
            },
        ],
    },
    {
        name: 'attachTakeProfitAndOrStopLossOrderToExistingPosition',
        description:
            'Attach take profit and/or stop loss orders to an existing futures position.  (This is sometimes called a futures OCO order.)  If the position already has TP/SL orders attached, they will be replaced.  Pass 0 as the TP price or SL price to cancel any existing TP or SL orders, respectively.',
        required: ['market', 'marketType', 'takeProfitPrice', 'takeProfitType', 'stopLossPrice', 'stopLossType'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
            },
            MARKET_TYPE_PARAMETER_FUTURES_ONLY,
            {
                name: 'takeProfitPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the take profit order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided. Set to 0 to cancel any existing take profit order attached to the position.',
            },
            {
                name: 'takeProfitType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether takeProfitPrice is an absolute price or a percentage from current price.',
            },
            {
                name: 'stopLossPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the stop loss order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided. Set to 0 to cancel any existing stop loss order attached to the position.',
            },
            {
                name: 'stopLossType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether stopLossPrice is an absolute price or a percentage from current price.',
            },
        ],
    },
    {
        name: 'attachTrailingStopToExistingPosition',
        description: 'Attach a trailing stop to an existing futures position.  Pass 0 as the trailing distance to cancel any existing trailing stop attached to the position.',
        required: ['market', 'marketType', 'trailingStopDistance', 'trailingStopDistanceType', 'activationPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: FUTURES_MARKET_DESCRIPTION,
            },
            MARKET_TYPE_PARAMETER_FUTURES_ONLY,
            {
                name: 'trailingStopDistance',
                type: 'number',
                description: 'Distance (absolute price) at which the trailing stop will be activated.  Pass 0 to cancel any existing trailing stop attached to the position.',
            },
            {
                name: 'trailingStopDistanceType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether trailingStopDistance is an absolute price or a percentage from current price.',
            },
            {
                name: 'activationPrice',
                type: ['number', 'null'],
                description: 'Optional activation price; ignored if trailingStopDistance is 0.',
            },
        ],
    },
    {
        name: 'createSpotTrailingStopOrder',
        description: 'Create a trailing stop order for a spot market.  This is not supported by Bybit API, therefore this tool will just notify the user that it is not supported.',
        required: ['market', 'side', 'amount', 'trailingStopDistance'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: SPOT_MARKET_DESCRIPTION,
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Side of the order',
            },
            {
                name: 'amount',
                type: 'number',
                description: AMOUNT_DESCRIPTION,
            },
            {
                name: 'trailingStopDistance',
                type: 'number',
                description: 'Distance (absolute price) at which the trailing stop will be activated',
            },
        ],
    },
    {
        name: 'createSpotEntryOrderWithTakeProfitAndOrStopLossAttached',
        description: [
            'Create a PRIMARY buy/sell order WITH take profit and/or stop loss attached (OTOCO order).',
            '',
            'USE THIS TOOL when user wants ENTRY ORDER + TP/SL:',
            '- "Buy 1 BTC with stop loss at $60k" (creates buy order + SL)',
            '- "Sell ETH at $3500 with take profit at $4000" (creates sell limit order + TP)',
            '- "Purchase BTC at market with 10% TP and 5% SL" (creates market buy + both)',
            '',
            'DO NOT USE when user wants ONLY TP/SL orders:',
            '- "Set a 10% TP to buy BTC" → Use createSpotTakeProfitAndOrStopLossOrder',
            '- "Place stop loss order at $60k" → Use createSpotTakeProfitAndOrStopLossOrder',
            '',
            'Key: Creates ENTRY order (market or limit) that triggers TP/SL when filled',
        ].join('\n'),
        required: ['market', 'side', 'amount', 'amountCurrency', 'takeProfitPrice', 'takeProfitType', 'stopLossPrice', 'stopLossType', 'limitPrice'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: SPOT_MARKET_DESCRIPTION,
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Side of the order',
            },
            {
                name: 'amount',
                type: 'number',
                description: AMOUNT_DESCRIPTION,
            },
            AMOUNT_CURRENCY_PARAMETER,
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the entry order will be placed.  Include only if explicitly specified by the user.  Leave blank to set it to the market last price.',
            },
            {
                name: 'takeProfitPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the take profit order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided.',
            },
            {
                name: 'takeProfitType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether takeProfitPrice is an absolute price or a percentage from current/limit price.',
            },
            {
                name: 'stopLossPrice',
                type: ['number', 'null'],
                description:
                    'Price at which the stop loss order will be activated. Can be specified as absolute price or percentage. At least one of takeProfitPrice or stopLossPrice must be provided.',
            },
            {
                name: 'stopLossType',
                type: 'string',
                enum: ['absolute', 'percentage'],
                description: 'Whether stopLossPrice is an absolute price or a percentage from current/limit price.',
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
        props: [
            {
                name: 'currency',
                type: ['string', 'null'],
                description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"',
            },
        ],
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
