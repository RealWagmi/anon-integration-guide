import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getSonicBalance',
        description: 'Get the account balance of Sonic tokens (S)',
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
    {
        name: 'getTotalSonicInProtocol',
        description: 'Gets the total amount of Sonic tokens (S) in the protocol, including staked (delegated) and undelegated (pool) tokens',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
        ],
    },
    {
        name: 'getTotalStakedSonicInProtocol',
        description: 'Protocol function that gets the total amount of Sonic tokens (S) staked in the protocol; this includes only staked tokens, not pool tokens',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
        ],
    },
];
