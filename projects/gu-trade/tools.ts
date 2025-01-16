import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'deployToken',
        description: 'Deploy (create, launch) a token on the Gu Trade using a name, a symbol, a description and an image url',
        required: ['chainName', 'account', 'name', 'symbol', 'description', 'image'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deploy a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deploy a token',
            },
            {
                name: 'name',
                type: 'string',
                description: 'Name of the future token',
            },
            {
                name: 'symbol',
                type: 'string',
                description: 'Symbol (ticker) of the future token',
            },
            {
                name: 'description',
                type: 'string',
                description: 'Explicit description of the future token',
            },
            {
                name: 'image',
                type: 'string',
                description: 'Image url that leads to the icon of the future token',
            },
        ],
    },
    {
        name: 'buyToken',
        description: 'Buy (purchase) any coin that was launched on Gu Trade with given ETH amount',
        required: ['chainName', 'account', 'token', 'amount'],
        additionalProperties: true,
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to buy a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will buy a token',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker that user wants to buy',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of ETH to spend on the token purchase',
            },
            {
                name: 'slippage',
                type: 'bigint',
                description: 'Slippage tolerance (percentage). Default is 5%',
                optional: true,
            },
        ],
    },
    {
        name: 'sellToken',
        description: 'Sell the coin that was launched on Gu Trade in case you had it previously',
        required: ['chainName', 'account', 'token', 'amount'],
        additionalProperties: true,
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to sell a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will sell a token',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker that user wants to sell',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to sell for ETH',
            },
            {
                name: 'slippage',
                type: 'bigint',
                description: 'Slippage tolerance (percentage). Default is 5%',
                optional: true,
            },
        ],
    },
    {
        name: 'getLastCreatedToken',
        description: 'Fetch information about the token that was created the last one',
        required: [],
        props: [],
    },
    {
        name: 'getTokenAddress',
        description: 'Search for a token with given name or symbol',
        required: [],
        additionalProperties: true,
        props: [
            {
                name: 'input',
                type: 'string',
                description: 'Name or symbol of the searched token',
                optional: true,
            },
        ],
    },
    {
        name: 'getTokenMarketCap',
        description: 'Get current market capitalization of given token in ETH',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker',
            },
        ],
    },
    {
        name: 'getTokenMarketCapInUSD',
        description: 'Get current market capitalization of given token in USD',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker',
            },
        ],
    },
    {
        name: 'getTokenPrice',
        description: 'Get current price of given token in ETH',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker',
            },
        ],
    },
    {
        name: 'getTokenPriceInUsd',
        description: 'Get current price of given token in USD',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token address or name or ticker',
            },
        ],
    },
];
