import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositBorrower',
        description: 'Deposit tokens into a vault as a borrower',
        required: ['chainName', 'account', 'vaultName', 'amount'],
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
                name: 'vaultName',
                type: 'string',
                description: 'Name of the vault to deposit tokens into',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to deposit in decimal format',
            },
        ],
    },
    {
        name: 'withdrawBorrower',
        description: 'Withdraw tokens from a vault as a borrower',
        required: ['chainName', 'account', 'vaultName', 'amount'],
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
                name: 'vaultName',
                type: 'string',
                description: 'Name of the vault to withdraw tokens from',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to withdraw in decimal format',
            },
        ],
    },
    {
        name: 'depositLender',
        description: 'Deposit tokens into a vault as a lender',
        required: ['chainName', 'account', 'vaultName', 'amount'],
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
                name: 'vaultName',
                type: 'string',
                description: 'Name of the vault to deposit tokens into',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to deposit in decimal format',
            },
        ],
    },
    {
        name: 'withdrawLender',
        description: 'Withdraw tokens from a vault as a lender',
        required: ['chainName', 'account', 'vaultName', 'amount'],
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
                name: 'vaultName',
                type: 'string',
                description: 'Name of the vault to withdraw tokens from',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to withdraw in decimal format',
            },  
        ],
    }
];

