import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositSTS',
        description: 'Deposit stS token to Silo Finance',
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
                description: 'Amount of stS tokens to deposit in decimal format',
            },
        ],
    },
    {
        name: 'borrowWS',
        description: 'Borrow wS tokens from Silo Finance',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to borrow tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit tokens',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of wS tokens to borrow in decimal format',
            },
        ],
    },
    {
        name: 'getBorrowedAmountWS',
        description: 'Get borrowed wS amount from Silo Finance',
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
        name: 'getDepositedBalanceSTS',
        description: 'Get deposited stS amount in Silo Finance',
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
        name: 'getUserPositionOnSTSS',
        description: 'Get user position of stS/S market in Silo Finance',
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
        name: 'maxBorrowWS',
        description: 'Get maximum amount of wS that can be borrowed by an account',
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
        name: 'maxWithdrawSTS',
        description: 'Get maximum amount of stS that can be withdrawn by an account',
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
        name: 'repayWS',
        description: 'Repay wS tokens to Silo Finance',
        required: ['chainName', 'account', 'amount'],
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
                name: 'amount',
                type: 'string',
                description: 'Amount of wS tokens to repay in decimal format',
            },
        ],
    },
    {
        name: 'withdrawSTS',
        description: 'Withdraw stS tokens from Silo Finance',
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
                description: 'Amount of stS tokens to withdraw in decimal format',
            },
        ],
    },
];
