import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getEnsoSupportedProtocols',
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
        name: 'isProtocolSupportedByEnso',
        description: `Check if a protocol is supported by Enso by protocol's slug`,
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
        name: 'getEnsoSupportedTokens',
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
        name: 'isTokenSupportedByEnso',
        description: 'Check if token is supported by Enso',
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
        name: 'getTokenOut',
        description: 'Determines the token received (e.g., LP token, deposit receipt token) from a project for utilizing a specific underlying token.',
        required: ['chainName', 'project', 'underlyingToken'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'project',
                type: 'string',
                description: `Name of the target DeFi project or protocol whose token interaction is being examined (e.g., 'lido', 'aave')`,
            },
            {
                name: 'underlyingToken',
                type: 'string',
                description: 'Address of the underlying asset involved in the interaction with the project',
            },
        ],
    },

    {
        name: 'quote',
        description: 'Calculates the estimated output amount for a token route, finding the most optimal route across all available paths.',
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
                description: 'The wallet address of the user requesting the quote.',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'The contract address of the token user wants to route away from.',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'The contract address of the token user wants to route to.',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'The raw amount of tokenIn to route away from in wei',
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
