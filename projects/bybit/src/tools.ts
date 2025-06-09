import { AiTool } from '@heyanon/sdk';
import { MARGIN_MODES, MAX_MARKETS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS } from './constants';
import { SUPPORTED_MARKET_TYPES } from './helpers/exchange';

const MARKET_TYPE_PARAMETER = {
    name: 'marketType',
    type: 'string',
    description: `Market type`,
    enum: SUPPORTED_MARKET_TYPES,
};

const MARKET_DESCRIPTION = [
    'Symbol of the market.  The type of the market can be inferred from the symbol:',
    '- Spot markets symbols have the form "BTC/USDT", where the FIRST currency is the base currency and the SECOND currency is the quote currency.',
    '- Perpetual markets symbols have the form "BTC/USDT:USDT", where the THIRD currency is the settlement currency.',
    '- Delivery markets (also known as expiry markets) symbols have the form "BTC/USD:BTC-250926", where the LAST part of the symbol is the expiry date of the contract.',
].join(' ');

export const tools: AiTool[] = [
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
        description: 'Set the user configured leverage for a specific futures market',
        required: ['market', 'leverage'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Market symbol, e.g. "BTC/USDT:USDT" or "BTC/USDT:USDT-250926"',
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
        description: 'Add margin to an existing position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' },
            { name: 'amount', type: 'number', description: 'Amount to add' },
        ],
    },
    {
        name: 'reduceMarginFromPosition',
        description: 'Reduce margin from an existing position',
        required: ['market', 'amount'],
        props: [
            { name: 'market', type: 'string', description: 'Market symbol, e.g. "BTC/USDT:USDT"' },
            { name: 'amount', type: 'number', description: 'Amount to reduce' },
        ],
    },
    {
        name: 'getPositions',
        description: `Show the user's most recent ${MAX_POSITIONS_IN_RESULTS} open positions on future markets, including notional, margin, and PnL.`,
        required: [],
        props: [],
    },
    {
        name: 'getPositionOnMarket',
        description: `Show all details on the position held by the user on the given future market.  If you only have the currency, use getPositions and filter by currency.`,
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
            MARKET_TYPE_PARAMETER,
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
                description: 'Market symbol, e.g. "BTC/USDT:USDT" or "BTC/USDT:USDT-250926"',
            },
        ],
    },
];
