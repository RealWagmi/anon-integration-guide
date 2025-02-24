import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    // views
    {
        name: 'getUserVaultSvtBalance',
        description: "Gets user's SVT balance (aka shares) in a vault",
        required: ['chainName', 'account', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
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
                description: "Vault's address",
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
                enum: supportedChains.map(EVM.utils.getChainName),
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
                description: "Vault's address",
            },
        ],
    },
    {
        name: 'getVaultBaseApy',
        description: "Gets vault's base APY",
        required: ['chainName', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name where the vault exists',
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'Vault address',
            },
        ],
    },
    // transactions
    {
        name: 'userDepositToVault',
        description: 'Deposits an asset amount in vault, the asset type is defined by the vault',
        required: ['chainName', 'account', 'vaultAddress', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name where the vault exists',
            },
            {
                name: 'account',
                type: 'string',
                description: "The user's address",
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: "Vault's address",
            },
            {
                name: 'amount',
                type: 'the amount to be deposited to vault, the token type is defined by the vault',
                description: 'Vault address',
            },
        ],
    },
    {
        name: 'userFastRedeemFromVault',
        description:
            'Immediately withdraws an asset amount from a vault, the asset type is defined by the vault',
        required: ['chainName', 'account', 'vaultAddress', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name where the vault exists',
            },
            {
                name: 'account',
                type: 'string',
                description: "The user's address",
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: "Vault's address",
            },
            {
                name: 'amount',
                type:
                    'the amount to be withdrawn from the vault, the token type is defined by the vault',
                description: 'Vault address',
            },
        ],
    },
];
