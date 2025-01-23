import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getStakedSonicBalance',
        description: 'Get the account balance of staked Sonic tokens (stS)',
        required: ['chainName', 'account'],
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
                description: 'Account address to check',
            },
        ],
    },
    {
        name: 'stake',
        description: 'Stake Sonic tokens (S) and obtain in return staked Sonic tokens (stS)',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of chain where to stake tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
    // TODO: check if "unstake all of my stS" works
    {
        name: 'unStake',
        description: 'Initiate undelegation of staked Sonic tokens (stS). Tokens can be withdrawn after 14 days.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of chain where to unstake tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of stS tokens to undelegate in decimal format',
            },
        ],
    },
];
