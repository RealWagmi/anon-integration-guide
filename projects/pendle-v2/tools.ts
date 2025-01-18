import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

/**
 * Tool definitions for Pendle v2 integration
 * Each tool represents a function that can be called by the AI
 */
export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Adds liquidity to a Pendle market by providing multiple tokens',
        required: ['chainName', 'account', 'marketAddress', 'tokenIn', 'amounts', 'minLpOut'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network'
            },
            {
                name: 'account',
                type: 'string',
                description: 'User\'s wallet address'
            },
            {
                name: 'marketAddress',
                type: 'string',
                description: 'Address of the Pendle market'
            },
            {
                name: 'tokenIn',
                type: 'array',
                items: { type: 'string' },
                description: 'Array of token addresses to provide as liquidity'
            },
            {
                name: 'amounts',
                type: 'array',
                items: { type: 'string' },
                description: 'Array of token amounts to provide (in decimal format)'
            },
            {
                name: 'minLpOut',
                type: 'string',
                description: 'Minimum LP tokens expected to receive'
            }
        ]
    },
    {
        name: 'claimRewards',
        description: 'Claims accumulated rewards from a Pendle market position',
        required: ['chainName', 'account', 'marketAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network'
            },
            {
                name: 'account',
                type: 'string',
                description: 'User\'s wallet address'
            },
            {
                name: 'marketAddress',
                type: 'string',
                description: 'Address of the Pendle market'
            }
        ]
    },
    {
        name: 'getMarketInfo',
        description: 'Retrieves market information including expiry status and rewards data',
        required: ['chainName', 'marketAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network'
            },
            {
                name: 'marketAddress',
                type: 'string',
                description: 'Address of the Pendle market'
            }
        ]
    }
];

export default tools;
