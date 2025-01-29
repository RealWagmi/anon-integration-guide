import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

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
        name: 'getUserVaultBalance',
        description: "Gets user's assets balances in a vault",
        required: ['chainName', 'account', 'vaultAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the vault and account exist',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will check the vault balances',
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'Vault address that will check the user balances',
            },
        ],
    },
];
