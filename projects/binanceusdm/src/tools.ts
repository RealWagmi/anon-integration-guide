import { AiTool } from '@heyanon/sdk';
import { ACCOUNT_TYPES, MAX_ORDERS_IN_RESULTS } from './constants';

export const tools: AiTool[] = [
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
        description: 'Get balance for all currencies/tokens on the given account type.  For each currency, also show how much is available to trade (free).',
        required: ['type', 'currency'],
        props: [
            { name: 'type', type: ['string', 'null'], enum: ACCOUNT_TYPES, description: 'Account type to get balance for.  e.g. "future" or "spot".  Defaults to "future".' },
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
