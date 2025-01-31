import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
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
