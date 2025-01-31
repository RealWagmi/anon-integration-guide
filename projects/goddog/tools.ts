import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';
export const tools: AiTool[] = [
    {
        name: 'addLiquidityOnUniswapV3',
        description: 'Add Liquidity on Uniswap V3 with specific amount of specific token',
        required: ['account', 'tokenAddress', 'tokenAmount', 'chainId'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'account address',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'token Address',
            },
            {
                name: 'tokenAmount',
                type: 'string',
                description: 'token amount',
            },
            {
                name: 'chainId',
                type: 'number',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the transaction',
            },
        ],
    },
    {
        name: 'createVault',
        description: 'Create vault on Charming for the specific Uniswap V3 Pool',
        required: ['account', 'poolAddress', 'agentAddress', 'chainId'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'account address',
            },
            {
                name: 'poolAddress',
                type: 'string',
                description: 'pool Address',
            },
            {
                name: 'agentAddress',
                type: 'string',
                description: 'agent Address',
            },
            {
                name: 'chainId',
                type: 'number',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the transaction',
            },
        ],
    },
    {
        name: 'depositToVault',
        description: 'Deposit tokens to the specific Charming Vault',
        required: ['account', 'vaultAddress', 'amount0', 'amount1', 'recipient', 'chainId'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'account address',
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'vault Address',
            },
            {
                name: 'amount0',
                type: 'string',
                description: 'amount of token0',
            },
            {
                name: 'amount1',
                type: 'string',
                description: 'amount of token1',
            },
            {
                name: 'recipient',
                type: 'string',
                description: 'receiver who will gets reward',
            },
            {
                name: 'chainId',
                type: 'number',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the transaction',
            },
        ],
    },
    {
        name: 'withdrawFromVault',
        description: 'Withdraw tokens from the specific Charming Vault',
        required: ['account', 'vaultAddress', 'shareAmount', 'recipient', 'chainId'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'account address',
            },
            {
                name: 'vaultAddress',
                type: 'string',
                description: 'vault Address',
            },
            {
                name: 'shareAmount',
                type: 'string',
                description: 'share Amount to Withdraw',
            },
            {
                name: 'recipient',
                type: 'string',
                description: 'receiver who will gets tokens',
            },
            {
                name: 'chainId',
                type: 'number',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the transaction',
            },
        ],
    },
];
