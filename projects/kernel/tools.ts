import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'stakeAssetByAddress',
        description: 'Stake a supported asset (token) in the protocol by its address',
        required: ['chainName', 'account', 'token', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake a token',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Address of a token that will be staked',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to be staked in the protocol',
            },
        ],
    },
    {
        name: 'stakeAssetBySymbol',
        description: 'Stake a supported asset (token) in the protocol by its symbol (ticker)',
        required: ['chainName', 'account', 'token', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake a token',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Symbol (ticker) of a token that will be staked',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to be staked in the protocol',
            },
        ],
    },
    {
        name: 'stakeBNB',
        description: 'Stake BNB (native currency) in the protocol',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to stake BNB',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake BNB',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of BNB to be staked in the protocol',
            },
        ],
    },
    {
        name: 'unstakeAssetByAddress',
        description: 'Unstake a supported asset (token) from the protocol by its address',
        required: ['chainName', 'account', 'token', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where from unstake a token',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake a token',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Address of a token that will be unstaked',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to be unstaked from the protocol',
            },
        ],
    },
    {
        name: 'unstakeBNB',
        description: 'Unstake BNB (native currency) from the protocol',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where from unstake BNB',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake BNB',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of BNB to be unstaked from the protocol',
            },
        ],
    },
    {
        name: 'getPointsForAsset',
        description: 'Get daily points for a supported asset',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Token symbol (ticker)',
            },
        ],
    },
    {
        name: 'getUserPoints',
        description: 'Get user total accumulated points in the protocol',
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User account address',
            },
        ],
    },
    {
        name: 'getTvl',
        description: 'Get current TVL (total value locked) in the protocol',
        required: [],
        props: [],
    },
];
