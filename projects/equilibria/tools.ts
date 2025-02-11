import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositLP',
        description: 'Deposits LP tokens into Equilibria\'s PendleBooster contract to earn rewards',
        required: ['chainName', 'account', 'poolId', 'amount', 'lpTokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit LP tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit LP tokens',
            },
            {
                name: 'poolId',
                type: 'number',
                description: 'ID of the pool to deposit into',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP tokens to deposit in decimal format',
            },
            {
                name: 'lpTokenAddress',
                type: 'string',
                description: 'Address of the LP token contract',
            },
            {
                name: 'stake',
                type: 'boolean',
                description: 'Whether to stake the deposited LP tokens (default: true)',
                optional: true,
            }
        ],
    },
    {
        name: 'withdrawLP',
        description: 'Withdraws LP tokens from Equilibria\'s PendleBooster contract',
        required: ['chainName', 'account', 'poolId', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw LP tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw LP tokens',
            },
            {
                name: 'poolId',
                type: 'number',
                description: 'ID of the pool to withdraw from',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP tokens to withdraw in decimal format',
            },
        ],
    },
];
