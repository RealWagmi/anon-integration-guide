import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

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
        required: ['chainName', 'account', 'token', 'amount', 'slippage'],
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
                type: ['number', 'null'],
                description: 'Slippage tolerance (percentage). Default is 5%',
            },
        ],
    },
    {
        name: 'sellToken',
        description: 'Sell the coin that was launched on Gu Trade in case you had it previously',
        required: ['chainName', 'account', 'token', 'amount', 'slippage'],
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
                type: ['number', 'null'],
                description: 'Slippage tolerance (percentage). Default is 5%',
            },
        ],
    },
    {
        name: 'getTokenAddress',
        description: 'Search for a token with a given symbol',
        required: ['symbol'],
        props: [
            {
                name: 'symbol',
                type: 'string',
                description: 'Symbol of the searched token',
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
