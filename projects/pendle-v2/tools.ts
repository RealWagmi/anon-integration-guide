import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

/**
 * Tool definitions for Pendle v2 integration
 * Each tool represents a function that can be called by the AI
 */
export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Adds liquidity to a Pendle market',
        required: ['marketAddress', 'syDesired', 'ptDesired', 'blockTime'],
        props: [
            {
                name: 'marketAddress',
                type: 'string',
                description: 'Address of the Pendle market'
            },
            {
                name: 'syDesired',
                type: 'string',
                description: 'Amount of SY desired'
            },
            {
                name: 'ptDesired',
                type: 'string',
                description: 'Amount of PT desired'
            },
            {
                name: 'blockTime',
                type: 'number',
                description: 'Block time for the transaction'
            }
        ]
    },
    {
        name: 'removeLiquidity',
        description: 'Removes liquidity from a Pendle market',
        required: ['marketAddress', 'lpToRemove'],
        props: [
            {
                name: 'marketAddress',
                type: 'string',
                description: 'Address of the Pendle market'
            },
            {
                name: 'lpToRemove',
                type: 'string',
                description: 'Amount of LP to remove'
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
    },
    {
        name: 'redeemRewards',
        description: 'Redeems rewards for a user from the Pendle gauge',
        required: ['user', 'gaugeAddress'],
        props: [
            {
                name: 'user',
                type: 'string',
                description: 'User\'s wallet address'
            },
            {
                name: 'gaugeAddress',
                type: 'string',
                description: 'Address of the Pendle gauge'
            }
        ]
    },
    {
        name: 'redeemExternalReward',
        description: 'Redeems external rewards from the Pendle gauge',
        required: ['gaugeAddress'],
        props: [
            {
                name: 'gaugeAddress',
                type: 'string',
                description: 'Address of the Pendle gauge'
            }
        ]
    }
];

export default tools;
