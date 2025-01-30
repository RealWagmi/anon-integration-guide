import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getBorrowRates',
        description: 'Get current borrow rates for Jupiter Perpetuals markets',
        required: ['asset'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'],
                description: 'Asset to get rates for',
            }
        ],
    },
    {
        name: 'getHistoricalRates',
        description: 'Get historical borrow rates for a specific market',
        required: ['asset', 'hours'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'],
                description: 'Asset to get historical rates for',
            },
            {
                name: 'hours',
                type: 'number',
                description: 'Number of hours of history to retrieve (max 168)',
            }
        ],
    },
    {
        name: 'getMarketUtilization',
        description: 'Get current utilization rates for Jupiter Perpetuals markets',
        required: ['asset'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'],
                description: 'Asset to get utilization for',
            }
        ],
    }
];