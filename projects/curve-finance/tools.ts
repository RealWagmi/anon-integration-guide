import { AiTool, AiToolProps, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'swap',
        description: 'Swap tokens using Curve StableSwapNG pool. Allows token exchange with specified slippage protection.',
        required: ['chainName', 'poolAddress', 'fromToken', 'toToken', 'amount', 'slippage', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'fromToken',
                description: 'Index of the token to sell (i)',
                type: 'number'
            },
            {
                name: 'toToken',
                description: 'Index of the token to buy (j)',
                type: 'number'
            },
            {
                name: 'amount',
                description: 'Amount of tokens to swap in decimal format',
                type: 'string'
            },
            {
                name: 'slippage',
                description: 'Maximum allowed slippage percentage (e.g., "0.5" for 0.5%)',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will execute the swap',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'addLiquidity',
        description: 'Add liquidity to Curve StableSwapNG pool. Deposits multiple tokens and receives LP tokens in return.',
        required: ['chainName', 'poolAddress', 'amounts', 'slippage', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to add liquidity',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'amounts',
                description: 'Array of token amounts to deposit in decimal format, matching pool token order',
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            {
                name: 'slippage',
                description: 'Maximum allowed slippage percentage (e.g., "0.5" for 0.5%)',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will provide liquidity',
                type: 'string'
            }
        ],
        strict: true
    }
];