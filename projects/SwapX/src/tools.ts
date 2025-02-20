import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Adds liquidity to Swap X in a vault managed by ICHI, to earn rewards and increase liquidity',
        required: ['account', 'vault', 'amount0', 'amount1'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will add liquidity',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault to add liquidity to',
            },
            {
                name: 'amount0',
                type: 'string',
                description: 'Amount of token0 to add to the vault in decimal format, make sure the token is allowed, otherwise it should be 0',
            },
            {
                name: 'amount1',
                type: 'string',
                description: 'Amount of token1 to add to the vault in decimal format, make sure the token is allowed, otherwise it should be 0',
            },
        ],
    },
    {
        name: 'getLiquidityBalance',
        description: 'Gets the current liquidity balance for an account in a specific vault',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check balance for',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault to check balance in',
            },
        ],
    },
    {
        name: 'getLiquidityVaultsList',
        description: 'Displays a list of all available liquidity vaults',
        required: [],
        props: [],
    },
    {
        name: 'removeLiquidity',
        description: 'Removes liquidity from a Swap X vault managed by ICHI',
        required: ['account', 'vault', 'amount'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will remove liquidity',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault to remove liquidity from',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP tokens to remove from the vault in decimal format',
            },
        ],
    },
    {
        name: 'claimRewards',
        description: 'Claims available rewards from staked LP tokens in the gauge',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim rewards',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
        ],
    },
    {
        name: 'getGaugeBalance',
        description: 'Gets the current staked LP token balance in a gauge',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check balance for',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
        ],
    },
    {
        name: 'getPendingRewards',
        description: 'Gets the pending rewards available to claim from staked LP tokens',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check pending rewards for',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
        ],
    },
    {
        name: 'stakeLP',
        description: 'Stakes LP tokens in a gauge to earn additional rewards',
        required: ['account', 'vault', 'amount'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will stake LP tokens',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP tokens to stake in decimal format',
            },
        ],
    },
    {
        name: 'unstakeAllLPAndHarvest',
        description: 'Unstakes all LP tokens from a gauge and claims available rewards',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake LP tokens and harvest rewards',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
        ],
    },
    {
        name: 'unstakeLP',
        description: 'Unstakes a specific amount of LP tokens from a gauge',
        required: ['account', 'vault', 'amount'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will unstake LP tokens',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Address of the ICHI vault associated with the gauge',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of LP tokens to unstake',
            },
        ],
    },
];
