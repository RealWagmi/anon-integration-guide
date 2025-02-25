import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'getBorrowRates',
        description: 'Get current borrow rates, utilization, liquidity, and fees for Jupiter Perpetuals markets',
        required: ['asset'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: ['SOL', 'ETH', 'WBTC'],
                description: 'Asset to get market data for',
            },
        ],
    },
];
