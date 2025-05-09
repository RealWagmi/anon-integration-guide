import { AiTool } from '@heyanon/sdk';
import { ACCOUNT_TYPES, MAX_MARKETS_IN_RESULTS, MAX_ORDERS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS } from './constants';

export const tools: AiTool[] = [
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
        description: `Show the user's most recent ${MAX_POSITIONS_IN_RESULTS} open positions`,
        required: [],
        props: [],
    },
    {
        name: 'getPositionOnMarket',
        description: `Show information on the position held by the user on the given market.  If you only have the currency, use getPositions and filter by currency.`,
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
            'Get price, volume and leverage information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to get information for, for example "BTC/USDT:USDT"',
            },
        ],
    },
];
