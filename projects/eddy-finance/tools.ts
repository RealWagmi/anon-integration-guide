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
                description: 'Corresponding zrc20 token address of desired token on Ethereum chain',
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
];
