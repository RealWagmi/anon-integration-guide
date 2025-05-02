import { AiTool } from '@heyanon/sdk';
import { MAX_ORDERS_IN_RESULTS } from './constants';

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
                description: 'Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"',
            },
            {
                name: 'side',
                type: 'string',
                description: 'Side of the order, either "buy" or "sell"',
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  If not specified, the order will be a market order.',
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
                description: 'Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"',
            },
            {
                name: 'side',
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Side of the order; either "buy" or "sell"',
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of base currency to buy or sell',
            },
            {
                name: 'limitPrice',
                type: ['number', 'null'],
                description: 'Price at which the order will be executed.  If not specified, the order will be a market order.',
            },
            {
                name: 'triggerPrice',
                type: 'number',
                description: 'Price at which the order will be activated',
            },
        ],
    },
    // {
    //     name: 'createOrder',
    //     description: 'Create various types of orders. The order type determines which parameters are required.',
    //     required: ['market', 'type', 'side', 'amount', 'price', 'triggerPrice', 'ocoConfiguration', 'trailingPercent', 'trailingAmount', 'reduceOnly'],
    //     props: [
    //         {
    //             name: 'market',
    //             type: 'string',
    //             description: 'Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"',
    //         },
    //         {
    //             name: 'type',
    //             type: 'string',
    //             enum: ORDER_TYPES,
    //             description: 'Type of order to create',
    //         },
    //         {
    //             name: 'side',
    //             type: 'string',
    //             enum: ['buy', 'sell'],
    //             description: 'Side of the order; either "buy" or "sell"',
    //         },
    //         {
    //             name: 'amount',
    //             type: 'number',
    //             description: 'Amount of base currency to buy or sell',
    //         },
    //         {
    //             name: 'limitPrice',
    //             type: ['number', 'null'],
    //             description:
    //                 'Price for limit orders (required for limit orders, optional for other types).  The order will be executed at this price if the market price crosses the trigger price.',
    //         },
    //         {
    //             name: 'triggerConfiguration',
    //             type: ['object', 'null'],
    //             description: 'Configuration for orders of type "trigger", that is, orders that are sent only after the market price crosses the trigger price.',
    //             required: ['triggerPrice', 'triggerDirection'],
    //             properties: {
    //                 triggerPrice: {
    //                     type: 'number',
    //                     description: 'Trigger price for the order',
    //                 },
    //                 triggerDirection: {
    //                     type: 'string',
    //                     description: 'Direction of the trigger price; can be "greater_than", "less_than", or "null" if not specified',
    //                     enum: ['greater_than', 'less_than', 'null'],
    //                 },
    //             },
    //         },
    //         {
    //             name: 'ocoConfiguration',
    //             type: ['object', 'null'],
    //             description: 'Configuration for OCO orders',
    //             required: ['ocoStopLoss', 'ocoTakeProfit'],
    //             properties: {
    //                 ocoStopLoss: {
    //                     type: 'object',
    //                     description: 'Stop loss configuration for OCO orders (required: triggerPrice, optional: price)',
    //                     required: ['triggerPrice', 'price'],
    //                     properties: {
    //                         triggerPrice: {
    //                             type: 'number',
    //                         },
    //                         limitPrice: {
    //                             type: ['number', 'null'],
    //                         },
    //                     },
    //                 },
    //                 ocoTakeProfit: {
    //                     type: 'object',
    //                     description: 'Take profit configuration for OCO orders (required: triggerPrice, optional: price)',
    //                     required: ['triggerPrice', 'price'],
    //                     properties: {
    //                         triggerPrice: {
    //                             type: 'number',
    //                         },
    //                         limitPrice: {
    //                             type: ['number', 'null'],
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //         {
    //             name: 'trailingPercent',
    //             type: ['number', 'null'],
    //             description: 'Percentage away from market price for trailing orders',
    //         },
    //         {
    //             name: 'trailingAmount',
    //             type: ['number', 'null'],
    //             description: 'Fixed amount away from market price for trailing orders',
    //         },
    //         {
    //             name: 'reduceOnly',
    //             type: ['boolean', 'null'],
    //             description: 'Whether the order should only reduce position size (not open new position)',
    //         },
    //     ],
    // },
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
                description: 'Symbol of the market to get information for, for example "BTC/USDT" or "AAVE/ETH"',
            },
        ],
    },
];
