import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

const walletProps = [
    {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'The name of the chain on which the transaction will be executed.',
    },
    {
        name: 'account',
        type: 'string',
        description: 'Account address that will execute transaction',
    },
];

const walletRequiredProps = ['chainName', 'account'];

export const tools: AiTool[] = [
    {
        name: 'quoteExactInput',
        description: 'Returns calculated amount for swaps. Is specialized for routes containing a mix of V2 and V3 liquidity',
        required: [...walletRequiredProps, 'tokens', 'fees', 'amountIn'],
        props: [
            ...walletProps,
            {
                name: 'tokens',
                type: 'array',
                items: { type: 'string' },
                description: 'List of tokens between which you want to swap. There should be at least 2. Between each consecutive tokens there should be a pool.',
            },
            {
                name: 'fees',
                type: 'array',
                items: { type: 'string' },
                description:
                    'List of fees between each consecutive tokens. The fees are ordered and apply to each consecutive token pair fe. `fee[0]` would apply to pair of `tokens[0]` and `tokens[1]`',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount in of tokens to swap',
            },
        ],
    },
    {
        name: 'execute',
        description: 'Executes a swap along with provided inputs',
        required: [],
        props: [],
    },
];
