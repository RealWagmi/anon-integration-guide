import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

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
        name: 'getProtocol',
        description: 'Search for a protocol by its slug on specified chain',
        required: ['chainName', 'protocol'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'protocol',
                type: 'string',
                description: 'Protocol slug',
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
        name: 'getToken',
        description: 'Search for a token by its address on specified chain',
        required: ['chainName', 'address'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'address',
                type: 'string',
                description: 'Token address',
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
                description: 'Ethereum address of the token to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Ethereum address of the token to swap to',
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
                description: '10000 is 100%. Example user input - 0.3%, must be converted to 30',
            },
            {
                name: 'fee',
                type: 'number',
                description: 'Fee in basis points (1/10000), must be in range 0-100',
            },
            {
                name: 'feeReceiver',
                type: 'string',
                description: 'Fee in basis points (1/10000), must be in range 0-100',
            },
        ],
    },
];
