import { AiTool } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'stakeETH',
        description: 'Stake ETH through Lido and receive stETH in return',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to stake ETH on',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address staking ETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of ETH to stake in decimal format',
            },
        ],
    },
    {
        name: 'wrapStETH',
        description: 'Wrap stETH into wstETH (wrapped stETH)',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to perform the wrapping',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address performing the wrapping',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of stETH to wrap into wstETH',
            },
        ],
    },
    {
        name: 'unwrapWstETH',
        description: 'Unwrap wstETH back into stETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to perform the unwrapping',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address performing the unwrapping',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of wstETH to unwrap into stETH',
            },
        ],
    },
    {
        name: 'getStETHBalance',
        description: 'Retrieve the stETH balance for a specific account',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address to query the stETH balance',
            },
        ],
    },
    {
        name: 'getWstETHBalance',
        description: 'Retrieve the wstETH balance for a specific account',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address to query the wstETH balance',
            },
        ],
    },
    {
        name: 'requestWithdrawal',
        description: 'Request a withdrawal of stETH back to ETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to perform the withdrawal',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address requesting the withdrawal',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of stETH to withdraw to ETH',
            },
        ],
    },
    {
        name: 'claimWithdrawal',
        description: 'Claim a pending withdrawal of ETH',
        required: ['chainName', 'account', 'withdrawalId'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network where the withdrawal claim is made',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address claiming the withdrawal',
            },
            {
                name: 'withdrawalId',
                type: 'string',
                description: 'The ID of the withdrawal to claim',
            },
        ],
    },
    {
        name: 'getWstETHForStETH',
        description: 'Calculate how much wstETH you get for a given stETH amount',
        required: ['chainName', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of stETH to convert',
            },
        ],
    },
    {
        name: 'getStETHForWstETH',
        description: 'Calculate how much stETH you get for a given wstETH amount',
        required: ['chainName', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of wstETH to convert',
            },
        ],
    },
    {
        name: 'getTotalStaked',
        description: 'Retrieve the total staked ETH in Lido',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
        ],
    },
    {
        name: 'unlockStETH',
        description: 'Unlock stETH for a specific account to enable interactions',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to perform the unlocking',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address unlocking stETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of stETH to unlock',
            },
        ],
    },
    {
        name: 'getStETHAllowance',
        description: 'Retrieve the allowance of stETH for a specific spender',
        required: ['chainName', 'account', 'spender'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address to query for allowance',
            },
            {
                name: 'spender',
                type: 'string',
                description: 'The spender address to check the allowance for',
            },
        ],
    },
    {
        name: 'getTotalRewardsEarned',
        description: 'Calculate the total rewards earned for stETH staking',
        required: ['chainName', 'account', 'initialStakedAmount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains,
                description: 'The blockchain network to query',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address to query rewards for',
            },
            {
                name: 'initialStakedAmount',
                type: 'string',
                description: 'The initial amount of ETH staked',
            },
        ],
    },
    {
        name: 'calculateAPR',
        description: 'Calculate the APR (Annual Percentage Rate) based on rewards earned',
        required: ['initialStakedAmount', 'rewardsEarned', 'periodInDays'],
        props: [
            {
                name: 'initialStakedAmount',
                type: 'string',
                description: 'The initial amount of ETH staked',
            },
            {
                name: 'rewardsEarned',
                type: 'string',
                description: 'The total rewards earned in ETH',
            },
            {
                name: 'periodInDays',
                type: 'number',
                description: 'The number of days over which rewards were earned',
            },
        ],
    },
];
