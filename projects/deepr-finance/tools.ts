import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'borrowAsset',
        description: 'Borrows a certain amount of a given asset (token) from the protocol',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to borrow an asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will borrow an asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens (asset) to borrow',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be borrowed from the market',
            },
        ],
    },
    {
        name: 'lendAsset',
        description: 'Lends a certain amount of a given asset (token) to available market of the protocol for accruing extra APY',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to lend an asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will lend an asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens (asset) to lend',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be lent to the protocol',
            },
        ],
    },
    {
        name: 'withdrawAsset',
        description: 'Withdraws a certain amount of a given asset (token) from the protocol considering it was once lent',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw an asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw an asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens (asset) to withdraw',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be withdrawn from the protocol',
            },
        ],
    },
    {
        name: 'repayAsset',
        description: 'Repays (gives back) a certain amount of a given asset (token) to the protocol considering it was once borrowed',
        required: ['chainName', 'account', 'amount', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to repay an asset',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will repay an asset',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens (asset) to repay',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be repaid to the protocol',
            },
        ],
    },
    {
        name: 'stakeDeepr',
        description: 'Stakes (accumulates) protocol token DEEPR into the protocol for accruing extra APR',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake DEEPR',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake DEEPR',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of DEEPR to stake',
            },
        ],
    },
    {
        name: 'claimDeepr',
        description: 'Claims protocol token DEEPR for using lend, borrow and stake functions',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim DEEPR',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim DEEPR',
            },
        ],
    },
    {
        name: 'requestUnstakeDeepr',
        description: 'Makes request to fully unstake protocol token DEEPR from the protocol',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to unstake DEEPR',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake DEEPR',
            },
        ],
    },
    {
        name: 'withdrawLockedDeepr',
        description: 'Unlocks and withdraws protocol token DEEPR from the protocol after cool-down period passed',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw DEEPR',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw DEEPR',
            },
        ],
    },
    {
        name: 'enableAssetAsCollateral',
        description: 'Allows a given asset (token) to be used as a collateral to enable borrow against it',
        required: ['chainName', 'account', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to enable collateral',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will enable collateral',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be enabled for collateral',
            },
        ],
    },
    {
        name: 'disableAssetAsCollateral',
        description: 'Disallows a given asset (token) to be used as a collateral and disables borrowing against it',
        required: ['chainName', 'account', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to disable collateral',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will disable collateral',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be disabled for collateral',
            },
        ],
    },
    {
        name: 'getCloseFactor',
        description: 'Fetches current close factor, which shows the ratio between total borrowed and total supplied when liquidation occurs',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch protocol close factor',
            },
        ],
    },
    {
        name: 'getMarketBorrowRate',
        description: 'Fetches current borrow rates APY and APR for a given market (asset, token)',
        required: ['chainName', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch market borrow rate',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be fetched borrow rate for',
            },
        ],
    },
    {
        name: 'getMarketSupplyRate',
        description: 'Fetches current supply rates APY and APR for a given market (asset, token)',
        required: ['chainName', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch market supply rate',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be fetched supply rate for',
            },
        ],
    },
    {
        name: 'getStakeDeeprApr',
        description: 'Fetches current staking APR for the protocol token DEEPR',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch staking APR for DEEPR',
            },
        ],
    },
    {
        name: 'getTvl',
        description: 'Fetches current TVL (total value locked) in the protocol',
        required: [],
        props: [],
    },
    {
        name: 'getUsersHealthFactor',
        description: 'Fetches users health factor based on the borrowed and supplied amount dollar-wise',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch users health factor',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address which health factor will be fetched',
            },
        ],
    },
    {
        name: 'getUsersMarketPosition',
        description: 'Fetches users borrowed and supplied amount of asset (tokens)',
        required: ['chainName', 'account', 'asset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to fetch users market data',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address which market data will be fetched',
            },
            {
                name: 'asset',
                type: 'string',
                description: 'Asset to be fetched market data for',
            },
        ],
    },
];
