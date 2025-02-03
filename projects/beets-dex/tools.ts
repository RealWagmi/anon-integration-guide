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
    {
        name: 'getBestAprForToken',
        description: 'Show the top pools containing a specific token, sorted by APR. Only includes pools with TVL > $200,000.',
        required: ['chainName', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the token to search for',
            },
        ],
    },
    {
        name: 'getTokenAddressFromSymbol',
        description: 'Get the address of a token from its symbol on a specific chain',
        required: ['chainName', 'symbol'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'symbol',
                type: 'string',
                description: 'Token symbol (e.g. "wS", "stS", "USDC.e")',
            },
        ],
    },
];
