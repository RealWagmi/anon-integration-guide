import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'createSimpleSpotOrder',
        description: 'Create a simple spot order, with no conditionals attached.  For example, to buy 1 BTC for 100,000 USDT, you would set the symbol to "BTC/USDT", the type to "limit", the side to "buy", the amount to 1, the price to 100000.',
        required: ['symbol', 'type', 'side', 'amount', 'price'],
        props: [
            {
                name: 'symbol',
                type: 'string',
                description: 'Symbol of the pair to trade, for example "BTC/USDT" or "AAVE/ETH"',
            },
            {
                name: 'type',
                type: 'string',
                enum: ['limit', 'market'],
                description: 'Type of the order; either "limit" or "market"',
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
                description: 'Amount of tokens to buy or sell, e.g. 1 for 1 BTC',
            },
            {
                name: 'price',
                type: 'number',
                description: 'Buy or sell at this price.  Only for limit orders.',
            },
        ],
    },
];
