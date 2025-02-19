import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
    {
        name: 'cancelRedeemAsset',
        description: 'Cancel redeem of LP asset (scETH, scUSD) from the Rings protocol',
        required: ['chainName', 'account', 'asset'],
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
            {
                name: 'asset',
                type: 'string',
                description: 'Asset for which the redeem will be cancelled',
            },
        ],
    },
    {
        name: 'cancelUnstakeAsset',
        description: 'Cancel the unstaking of LP asset (scETH, scUSD) from the Rings protocol',
        required: ['chainName', 'account', 'asset'],
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
            {
                name: 'asset',
                type: 'string',
                description: 'Asset for which the unstake will be cancelled',
            },
        ],
    },
    {
        name: 'delegateVotes',
        description: 'Delegate all voting power from vote asset (veETH, veUSD) to delegatee',
        required: ['chainName', 'account', 'asset', 'delegatee'],
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
                name: 'asset',
                type: 'string',
                description: 'Asset whose voting power will be delegated',
            },
            {
                name: 'delegatee',
                type: 'string',
                description: 'Account address that will receive delegated votes',
            },
        ],
    },
    {
        name: 'depositAsset',
        description: 'Deposit asset (WETH, USDC) into the Rings protocol and receive LP asset (scETH, scUSD)',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Asset amount that will be deposited',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be deposited',
            },
        ],
    },
    {
        name: 'extendLock',
        description: 'Extend locking duration of staked asset (stkscETH, stkscUSD) in the protocol for extra voting power',
        required: ['chainName', 'account', 'asset', 'weeks'],
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
                name: 'asset',
                type: 'string',
                description: 'Asset that will be extended lock for',
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
        name: 'getTvl',
        description: 'Fetch current TVL (total value locked) on Sonic',
        required: [],
        props: [],
    },
    {
        name: 'increaseLockedAsset',
        description: 'Increase amount of locked staked asset (veETH, veUSD) in the protocol for extra voting power',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to increase locked staked asset amount',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will increase locked staked asset amount',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Staked asset amount to be locked in the protocol',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be locked',
            },
        ],
    },
    {
        name: 'lockAsset',
        description: 'Lock staked asset (stkscETH, stkscUSD) for the opportunity to vote',
        required: ['chainName', 'account', 'amount', 'asset', 'weeks'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to lock staked asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will lock staked asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Staked asset amount to be locked in the protocol',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be locked',
            },
            {
                name: 'weeks',
                type: 'number',
                description: 'Locking period in weeks',
            },
        ],
    },
    {
        name: 'redeemAsset',
        description: 'Redeem asset (WETH, USDC) from the Rings protocol',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to redeem asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will redeem asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP asset (scETH, scUSD) to be returned',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be redeemed',
            },
        ],
    },
    {
        name: 'stakeAsset',
        description: 'Stake LP asset (scETH, scUSD) in the Rings protocol',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake LP asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of asset to be staked',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be staked',
            },
        ],
    },
    {
        name: 'unstakeAsset',
        description: 'Unstake LP asset (scETH, scUSD) from the Rings protocol',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unstake asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of staked asset (stkscETH, stkscUSD) to be returned',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be unstaked',
            },
        ],
    },
    {
        name: 'unlockAsset',
        description: 'Unlock staked asset (stkscETH, stkscUSD) from the Rings protocol',
        required: ['chainName', 'account', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unlock asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unlock asset',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset that will be unstaked',
            },
        ],
    },
];

