import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
    // Staking Functions
    {
        name: 'stakeETH',
        description: 'Stake ETH through Lido and receive stETH in return',
        required: ['chainName', 'account', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for staking' },
            { name: 'account', type: 'string', description: 'Account address staking ETH' },
            { name: 'amount', type: 'string', description: 'Amount of ETH to stake (decimal format)' },
        ],
    },
    {
        name: 'wrapStETH',
        description: 'Wrap stETH into wstETH (wrapped stETH)',
        required: ['chainName', 'account', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for wrapping' },
            { name: 'account', type: 'string', description: 'Account address performing the wrapping' },
            { name: 'amount', type: 'string', description: 'Amount of stETH to wrap' },
        ],
    },
    {
        name: 'unwrapWstETH',
        description: 'Unwrap wstETH back into stETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for unwrapping' },
            { name: 'account', type: 'string', description: 'Account address performing the unwrapping' },
            { name: 'amount', type: 'string', description: 'Amount of wstETH to unwrap' },
        ],
    },

    // 🌟 Balance Queries
    {
        name: 'getStETHBalance',
        description: 'Retrieve the stETH balance for a specific account',
        required: ['chainName', 'account'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network to query' },
            { name: 'account', type: 'string', description: 'Account address for balance check' },
        ],
    },
    {
        name: 'getWstETHBalance',
        description: 'Retrieve the wstETH balance for a specific account',
        required: ['chainName', 'account'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network to query' },
            { name: 'account', type: 'string', description: 'Account address for balance check' },
        ],
    },

    // 🌟 Withdrawal Functions
    {
        name: 'requestWithdrawStETH',
        description: 'Request a withdrawal of stETH back to ETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for withdrawal' },
            { name: 'account', type: 'string', description: 'Account requesting the withdrawal' },
            { name: 'amount', type: 'string', description: 'Amount of stETH to withdraw' },
        ],
    },
    {
        name: 'claimWithdrawStETH',
        description: 'Claim a pending withdrawal of ETH',
        required: ['chainName', 'account', 'requestIds'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for withdrawal' },
            { name: 'account', type: 'string', description: 'Account claiming the withdrawal' },
            { name: 'requestIds', type: 'number[]', description: 'IDs of the withdrawal requests to claim' },
        ],
    },

    // 🌟 Conversion Functions
    {
        name: 'getWstETHByStETH',
        description: 'Calculate how much wstETH you get for a given stETH amount',
        required: ['chainName', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for conversion' },
            { name: 'amount', type: 'string', description: 'Amount of stETH to convert' },
        ],
    },
    {
        name: 'getStETHByWstETH',
        description: 'Calculate how much stETH you get for a given wstETH amount',
        required: ['chainName', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network for conversion' },
            { name: 'amount', type: 'string', description: 'Amount of wstETH to convert' },
        ],
    },

    // 🌟 Analytics & Rewards
    {
        name: 'getTotalStaked',
        description: 'Retrieve the total staked ETH in Lido',
        required: ['chainName'],
        props: [{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network to query' }],
    },
    {
        name: 'getTotalRewardsEarned',
        description: 'Calculate the total rewards earned for stETH staking',
        required: ['chainName', 'account'],
        props: [
            { name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network to query' },
            { name: 'account', type: 'string', description: 'Account address for rewards query' },
        ],
    },
    {
        name: 'getLidoAPR',
        description: 'Fetches the latest Lido APR from the official Lido API',
        required: ['chainName'],
        props: [{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Blockchain network to query' }],
    },
];
