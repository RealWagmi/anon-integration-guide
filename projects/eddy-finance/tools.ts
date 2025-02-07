import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'bridgeToEthereum',
        description: 'Bridge native token to any destination token on Ethereum. This function is used to bridge native tokens from supported chains to Ethereum.',
        required: ['chainName', 'account', 'destToken', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Source chain to bridge from',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'destToken',
                type: 'string',
                description: 'Destination token symbol, example: USDT, USDC, etc.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
    {
        name: 'bridgeToBitcoin',
        description: 'Bridge native token to BTC on Bitcoin. This function is used to bridge native tokens from supported chains to Bitcoin.',
        required: ['chainName', 'account', 'btcWallet', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Source chain to bridge from',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'btcWallet',
                type: 'string',
                description: 'Bitcoin wallet address to receive funds',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
    {
        name: 'getBridgeQuote',
        description: 'Get quote for bridging tokens between chains. This function is used to get a quote for bridging tokens between chains.',
        required: ['srcChain', 'destChain', 'slippage', 'inputToken', 'outputToken', 'inputTokenDecimals', 'outputTokenDecimals', 'amount'],
        props: [
            {
                name: 'srcChain',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Source chain to bridge from',
            },
            {
                name: 'destChain',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Destination chain to bridge to',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage tolerance for the quote',
            },
            {
                name: 'inputToken',
                type: 'string',
                description: 'Input token address. Use - 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token',
            },
            {
                name: 'outputToken',
                type: 'string',
                description: 'Output token address. Use - 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token',
            },
            {
                name: 'inputTokenDecimals',
                type: 'number',
                description: 'Decimals of input token',
            },
            {
                name: 'outputTokenDecimals',
                type: 'number',
                description: 'Decimals of output token',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
];
