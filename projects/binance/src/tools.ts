import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'getCurrencyMarkets',
        description: 'Get a list of all active markets that include a given currency.  Returns a list of market symbols.',
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
        description: 'Get information about a specific market, most importantly: last price, bid price, ask price, 24h volume, and more.  Prices are in quote currency.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to get information for, for example "BTC/USDT" or "AAVE/ETH"',
            },
        ],
    },
    {
        name: 'createSimpleSpotOrder',
        description: 'Create a simple spot order, with no conditionals attached.  For example, to buy 1 BTC for 100,000 USDT, you would set the market to "BTC/USDT", the type to "limit", the side to "buy", the amount to 1, the price to 100000.',
        required: ['market', 'type', 'side', 'amount', 'price'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: 'Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"',
            },
            {
                name: 'type',
                type: 'string',
                enum: ['limit', 'market'],
                description: 'Type of the order; either "limit" or "market"',
            },
            {
                name: 'side',
                type: ['string', 'null'],
                enum: ['buy', 'sell'],
                description: 'Side of the order; either "buy" or "sell"',
            },
            {
                name: 'amount',
                type: 'number',
                description: 'Amount of currency to buy or sell, e.g. 1 for 1 BTC',
            },
            {
                name: 'price',
                type: ['number', 'null'],
                description: 'Buy or sell at this price.  Only for limit orders.',
            },
        ],
    },
];
