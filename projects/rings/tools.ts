import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'cancelRedeemEth',
        description: 'Cancel redeem of WETH from the Rings protocol',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to cancel the redeem',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will cancel the redeem',
            },
        ],
    },
    {
        name: 'cancelRedeemUsdc',
        description: 'Cancel redeem of USDC from the Rings protocol',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to cancel the redeem',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will cancel the redeem',
            },
        ],
    },
    {
        name: 'cancelUnstakeEth',
        description: 'Cancel the unstaking of scETH from the Rings protocol',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to cancel the unstaking',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will cancel the unstaking',
            },
        ],
    },
    {
        name: 'cancelUnstakeUsd',
        description: 'Cancel the unstaking of scUSD from the Rings protocol',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to cancel the unstaking',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will cancel the unstaking',
            },
        ],
    },
    {
        name: 'delegateVotesEth',
        description: 'Delegate all voting power from veETH to delegatee',
        required: ['chainName', 'account', 'delegatee'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to delegate votes',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will delegate votes',
            },
            {
                name: 'delegatee',
                type: 'string',
                description: 'Account address that will receive delegated votes',
            },
        ],
    },
    {
        name: 'delegateVotesUsd',
        description: 'Delegate all voting power from veUSD to delegatee',
        required: ['chainName', 'account', 'delegatee'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to delegate votes',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will delegate votes',
            },
            {
                name: 'delegatee',
                type: 'string',
                description: 'Account address that will receive delegated votes',
            },
        ],
    },
    {
        name: 'depositEth',
        description: 'Deposit WETH into the Rings protocol and receive scETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit WETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit WETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'WETH amount that will be deposited',
            },
        ],
    },
    {
        name: 'depositUsdc',
        description: 'Deposit USDC into the Rings protocol and receive scUSD',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit USDC',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit USDC',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'USDC amount that will be deposited',
            },
        ],
    },
    {
        name: 'extendLockEth',
        description: 'Extend duration of locking stkscETH in the protocol for extra voting power',
        required: ['chainName', 'account', 'weeks'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to extend locking period',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will extend locking period',
            },
            {
                name: 'weeks',
                type: 'number',
                description: 'Extension period in weeks',
            },
        ],
    },
    {
        name: 'extendLockUsd',
        description: 'Extend duration of locking stkscUSD in the protocol for extra voting power',
        required: ['chainName', 'account', 'weeks'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to extend locking period',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will extend locking period',
            },
            {
                name: 'weeks',
                type: 'number',
                description: 'Extension period in weeks',
            },
        ],
    },
    {
        name: 'getUserPoints',
        description: 'Fetch total user points',
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will be checked for points',
            },
        ],
    },
    {
        name: 'increaseLockedEth',
        description: 'Increase amount of locked stkscETH in the protocol for extra voting power',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to increase locked stkscETH amount',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will increase locked stkscETH amount',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'stkscETH amount to be locked in the protocol',
            },
        ],
    },
    {
        name: 'increaseLockedUsd',
        description: 'Increase amount of locked stkscUSD in the protocol for extra voting power',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to increase locked stkscUSD amount',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will increase locked stkscUSD amount',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'stkscUSD amount to be locked in the protocol',
            },
        ],
    },
    {
        name: 'lockEth',
        description: 'Lock stkscETH for the opportunity to vote',
        required: ['chainName', 'account', 'amount', 'weeks'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to lock stkscETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will lock stkscETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'stkscETH amount to be locked in the protocol',
            },
            {
                name: 'weeks',
                type: 'number',
                description: 'Locking period in weeks',
            },
        ],
    },
    {
        name: 'lockUsd',
        description: 'Lock stkscUSD for the opportunity to vote',
        required: ['chainName', 'account', 'amount', 'weeks'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to lock stkscUSD',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will lock stkscUSD',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'stkscUSD amount to be locked in the protocol',
            },
            {
                name: 'weeks',
                type: 'number',
                description: 'Locking period in weeks',
            },
        ],
    },
    {
        name: 'redeemEth',
        description: 'Redeem WETH from the Rings protocol in exchange for scETH',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to redeem WETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will redeem WETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'scETH amount to be exchanged for WETH',
            },
        ],
    },
    {
        name: 'redeemUsdc',
        description: 'Redeem USDC from the Rings protocol in exchange for scUSD',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to redeem USDC',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will redeem USDC',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'scUSD amount to be exchanged for USDC',
            },
        ],
    },
    {
        name: 'stakeEth',
        description: 'Stake scETH in the Rings protocol for earning yield',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake scETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake scETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of scETH to be staked',
            },
        ],
    },
    {
        name: 'stakeUsd',
        description: 'Stake scUSD in the Rings protocol for earning yield',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake scUSD',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake scUSD',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of scUSD to be staked',
            },
        ],
    },
    {
        name: 'unstakeEth',
        description: 'Unstake scETH from the Rings protocol',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unstake scETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake scETH',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of stkscETH to be exchanged for scETH',
            },
        ],
    },
    {
        name: 'unstakeUsd',
        description: 'Unstake scUSD from the Rings protocol',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unstake scUSD',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake scUSD',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of stkscUSD to be exchanged for scUSD',
            },
        ],
    },
    {
        name: 'unlockEth',
        description: 'Unlock stkscETH from the Rings protocol in exchange for veETH',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unlock stkscETH',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unlock stkscETH',
            },
        ],
    },
    {
        name: 'unlockUsd',
        description: 'Unlock stkscUSD from the Rings protocol in exchange for veUSD',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unlock stkscUSD',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unlock stkscUSD',
            },
        ],
    },
];

