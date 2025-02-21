import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
    {
        name: 'quote',
        description: 'Get quote for swapping tokens on Hypersonic DEX aggregator including best route and expected output amount.',
        required: ['chainName', 'inToken', 'outToken', 'inAmount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap. Currently only Sonic chain is supported.'
            },
            {
                name: 'inToken',
                type: 'string',
                description: 'The input token symbol (e.g., "wS" for wrapped Sonic). Must be a supported token.'
            },
            {
                name: 'outToken',
                type: 'string',
                description: 'The output token symbol (e.g., "USDT"). Must be a supported token.'
            },
            {
                name: 'inAmount',
                type: 'string',
                description: 'Amount of input tokens in wei format (e.g., "1000000000000000000" for 1 token)'
            }
        ],
    },
    {
        name: 'swap',
        description: 'Execute a routed token swap on Hypersonic DEX aggregator to get the best price across all DEXs.',
        required: ['chainName', 'account', 'inToken', 'outToken', 'inAmount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap. Currently only Sonic chain is supported.'
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the swap'
            },
            {
                name: 'inToken',
                type: 'string',
                description: 'The input token symbol (e.g., "wS" for wrapped Sonic). Must be a supported token.'
            },
            {
                name: 'outToken',
                type: 'string',
                description: 'The output token symbol (e.g., "USDT"). Must be a supported token.'
            },
            {
                name: 'inAmount',
                type: 'string',
                description: 'Amount of input tokens in wei format (e.g., "1000000000000000000" for 1 token)'
            }
        ],
    },
    {
        name: 'getDescription',
        description: 'Get detailed information about Hypersonic DEX aggregator and how to use it.',
        required: [],
        props: [],
    }
];