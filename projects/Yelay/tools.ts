import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';
import { getVaultBaseApy } from './functions/getVaultBaseApy';

export const tools: AiTool[] = [
    {
        name: 'example',
        description:
            'Example function that demonstrates how to interact with the protocol. It shows basic transaction flow, including checking balances, preparing transaction data, and handling approvals if needed.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the example',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
    // views
    {
        name: 'getUserVaultSvtBalance',
        description: "Gets user's SVT balance in a vault",
        required: ['chainName', 'account', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the vault and user address exist',
            },
            {
                name: 'account',
                type: 'string',
                description: "The user's address",
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'Vault address',
            },
        ],
    },
    {
        name: 'getUserVaultAssetBalance',
        description: "Gets user's assets balance in a vault",
        required: ['chainName', 'account', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the vault and user address exist',
            },
            {
                name: 'account',
                type: 'string',
                description: "The user's address",
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'Vault address',
            },
        ],
    },
    {
        name: 'getVaultBaseApy',
        description: "Gets vault's base APY",
        required: ['chainName', 'account', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the vault exists',
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'Vault address',
            },
        ],
    },
];
