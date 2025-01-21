import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'bridgeToHyperliquid',
        description: 'Bridges native USDC tokens from Arbitrum to Hyperliquid.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the bridge transaction is executed. (must be Arbitrum)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute transaction.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDC tokens to bridge. (minimum 5 USDC)',
            },
        ],
    },
];
