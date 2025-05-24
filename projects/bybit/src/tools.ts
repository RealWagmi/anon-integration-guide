import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'getBalance',
        description: 'Get the unified user balance.  This does not include open positions.  For each currency, show how much is available to trade (free).',
        required: ['currency'],
        props: [{ name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' }],
    },
];
