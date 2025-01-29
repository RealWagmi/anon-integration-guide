import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'swapExact',
        description: '',
        required: ['isExactIn', 'chainName', 'account', 'amount', 'recipient', 'maxSlippageInPercentage', 'inputTokenAddress', 'outputTokenAddress'],
        props: [
            {
                name: 'isExactIn',
                type: 'boolean',
                description:
                    'Set this to `true` when the user wants to swap an exact amount of `inputTokenAddress` to `outputTokenAddress`. If the user wants an exact amount of `outputTokenAddress` then set this to `false`.',
            },
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the example',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the swap',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
            {
                name: 'recipient',
                type: 'string',
                description: 'An optional field to specify where the output token is received. This defaults to `account` if not specified.',
            },
            {
                name: 'maxSlippageInPercentage',
                type: 'string',
                description: 'The maximum allowed slippage in swapping the tokens. This value should be in percentage (e.g. 0.5 for 0.5%)',
            },
            {
                name: 'inputTokenAddress',
                type: 'string',
                description: 'An ERC20 address of the token that will be used to sell in exchange for the `outputTokenAddress`',
            },
            {
                name: 'outputTokenAddress',
                type: 'string',
                description: 'An ERC20 address of the token that the user will receive after the swap.',
            },
        ],
    },
];
