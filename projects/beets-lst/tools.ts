import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
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
        name: 'withdraw',
        description: 'Withdraw Sonic tokens (S) for the withdraw request identified by the provided ID',
        required: ['chainName', 'account', 'withdrawId'],
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
                description: 'Account address to withdraw tokens to',
            },
            {
                name: 'withdrawId',
                type: 'string',
                description: 'ID of the withdraw request to process',
            },
        ],
    },
    {
        name: 'withdrawAll',
        description: 'Withdraw Sonic tokens (S) from all withdraw requests that have completed the 14-day waiting period',
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
                description: 'Account address to withdraw tokens to',
            },
        ],
    },
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
    {
        name: 'getProtocolStakedSonicToSonicExchangeRate',
        description: 'Protocol function that gets how much is worth a staked Sonic token (stS) in Sonic tokens (S); this is defined to be equal to the share conversion rate',
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
        name: 'getProtocolSonicToStakedSonicExchangeRate',
        description:
            'Protocol function that gets how much is worth a Sonic token (S) in stakedSonic tokens (stS); this is defined to be equal to the inverse of the share conversion rate',
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
        name: 'getOpenWithdrawRequests',
        description:
            'Get the list of open withdrawals for the user.  A withdrawal is open if it is either ready to be withdrawn or waiting for the 14-day period to elapse.  The withdrawal ID will be shown for each withdrawal.',
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
                description: 'Account address to check withdrawals for',
            },
        ],
    },
    {
        name: 'getNextWithdrawal',
        description: 'Get details of the withdrawal request that is closest to being ready to be withdrawn.  This is useful for checking how long before a user can withdraw.',
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
                description: 'Account address to check withdrawals for',
            },
        ],
    },
    {
        name: 'getStakingApr',
        description: 'Get the annualized yield from stS tokens in the form of an APR (annual percentage rate)',
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
