import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getMyPositionsPortfolio',
        description: 'Show the liquidity positions in the user portfolio.  For each position, show the tokens in the pool, the type of pool, the amounts of tokens, the APR yield, and the dollar value of the position.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address of the user',
            },
        ],
    },
];
