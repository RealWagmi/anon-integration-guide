import { AiTool, getChainName } from '@heyanon/sdk';
import { ENSO_ROUTING_STRATEGIES, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getProtocols',
        description: 'Get protocols that are supported by Enso on specified chain',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
        ],
    },
    {
        name: 'getTokens',
        description: 'Get tokens that are supported by Enso on specified chain',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
        ],
    },
    {
        name: 'route',
        description: 'Execute best route from a token to a token',
        required: ['chainName', 'account', 'tokenIn', 'tokenOut', 'amountIn'],
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
                description: 'Account address',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Ethereum address of the token to swap from. For ETH, use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Ethereum address of the token to swap to. For ETH, use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount of tokenIn to swap in wei',
            },
            {
                name: 'amountOut',
                type: 'string',
                description: 'Amount of tokenOut to receive',
            },
            {
                name: 'routingStrategy',
                enum: ENSO_ROUTING_STRATEGIES,
                type: 'string',
                description: 'Routing strategy to use',
            },
            {
                name: 'receiver',
                type: 'string',
                description: 'Ethereum address of the receiver of the tokenOut. Default - account',
            },
            {
                name: 'spender',
                type: 'string',
                description: 'Ethereum address of the spender of the tokenIn. Default - account',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage in basis points (1/10000)',
            },
            {
                name: 'disableRFQs',
                type: 'boolean',
                description: 'Indicate whether to exexcute RFQ sources from routes',
            },
            {
                name: 'ignoreAggregators',
                type: 'string[]',
                description: 'A list of swap aggregators to be ignored from consideration',
            },
            {
                name: 'ignoreStandards',
                type: 'string[]',
                description: 'A list of standards to be ignored from consideration',
            },
        ],
    },
];