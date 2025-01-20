import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';
import { addLiquidity, removeLiquidity } from './functions/liquidity';

export const tools: AiTool[] = [
    {
        name: 'example',
        description: 'Example function that demonstrates how to interact with the protocol. It shows basic transaction flow, including checking balances, preparing transaction data, and handling approvals if needed.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the example',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
    {
        name: 'addLiquidity',
        description: 'Add liquidity to the protocol by providing tokens in exchange for GLP',
        required: ['chainName', 'tokenIn', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Address of the token to provide as liquidity',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to provide as liquidity',
            },
            {
                name: 'minOut',
                type: 'string',
                description: 'Minimum amount of GLP tokens to receive',
                optional: true,
            },
        ],
        function: addLiquidity,
    },
    {
        name: 'removeLiquidity',
        description: 'Remove liquidity from the protocol by burning GLP tokens',
        required: ['chainName', 'tokenOut', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Address of the token to receive when removing liquidity',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of ALP tokens to burn',
            },
            {
                name: 'minOut',
                type: 'string',
                description: 'Minimum amount of tokens to receive',
                optional: true,
            },
        ],
        function: removeLiquidity,
    },
];
