import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'stakeSTR',
        description: 'Stake (supply) USDS tokens in Sky Token Rewards (STR) module to earn SKY rewards',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDS tokens to stake in decimal format',
            },
        ],
    },
    {
        name: 'withdrawSTR',
        description: 'Withdraw staked USDS tokens from Sky Token Rewards (STR) module',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDS tokens to withdraw in decimal format',
            },
        ],
    },
    {
        name: 'claimRewardSTR',
        description: 'Claim earned SKY rewards from Sky Token Rewards (STR) module',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim rewards',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim rewards',
            },
        ],
    },
    {
        name: 'exitSTR',
        description: 'Withdraw all staked USDS tokens and claim all SKY rewards from Sky Token Rewards (STR) module',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to exit staking',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will exit staking',
            },
        ],
    },
    {
        name: 'depositSSR',
        description: 'Deposit (stake,supply) USDS tokens to Sky Savings Rate (SSR) module to mint sUSDS tokens with auto-compounding rewards',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDS tokens to deposit in decimal format',
            },
        ],
    },
    {
        name: 'withdrawSSR',
        description: 'Withdraw (burn,withdraw) USDS tokens from Sky Savings Rate (SSR) module by burning sUSDS tokens',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDS tokens to withdraw in decimal format',
            },
        ],
    },
    {
        name: 'convertToSharesSSR',
        description: 'Calculate how many sUSDS tokens you will receive for a given amount of USDS',
        required: ['chainName', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDS tokens in decimal format',
            },
        ],
    },
    {
        name: 'convertToAssetsSSR',
        description: 'Calculate how many USDS tokens you will receive for a given amount of sUSDS',
        required: ['chainName', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of sUSDS tokens in decimal format',
            },
        ],
    },
    {
        name: 'maxWithdrawSSR',
        description: 'Get maximum amount of USDS that can be withdrawn by an account',
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
        name: 'redeemSSR',
        description: 'Redeem (burn,withdraw) sUSDS tokens for USDS tokens',
        required: ['chainName', 'account', 'shares'],
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
                description: 'Account address',
            },
            {
                name: 'shares',
                type: 'string',
                description: 'Amount of sUSDS tokens to redeem in decimal format',
            },
        ],
    },
    {
        name: 'maxRedeemSSR',
        description: 'Get maximum amount of sUSDS that can be redeemed by an account',
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
        name: 'getStakedBalanceSTR',
        description: 'Get staked USDS balance in Sky Token Rewards (STR) module',
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
        name: 'getPendingRewardSTR',
        description: 'Get pending SKY rewards in Sky Token Rewards (STR) module',
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
        name: 'rewardPerTokenSTR',
        description: 'Get current reward rate per staked token in Sky Token Rewards (STR) module',
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
        name: 'getUserPositionOnSKY',
        description: 'Get complete user position in Sky protocol including STR staking and SSR positions',
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
        name: 'getSkySupportedChains',
        description: 'Get a list of Sky supported networks with their names and Chain IDs',
        required: [],
        props: [],
    },
];
