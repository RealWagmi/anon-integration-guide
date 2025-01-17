import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Add liquidity to an Equalizer pair. Approves token spending if necessary.',
        required: ['chainName', 'account', 'token0Address', 'token1Address', 'isStable', 'amount0Desired', 'amount1Desired', 'amount0Min', 'amount1Min'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to add liquidity',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will provide liquidity',
            },
            {
                name: 'token0Address',
                type: 'string',
                description: 'Contract address of the first token',
            },
            {
                name: 'token1Address',
                type: 'string',
                description: 'Contract address of the second token',
            },
            {
                name: 'isStable',
                type: 'boolean',
                description: 'Whether the pair is a stable pair',
            },
            {
                name: 'amount0Desired',
                type: 'string',
                description: 'Desired amount of first token to add in decimal format',
            },
            {
                name: 'amount1Desired',
                type: 'string',
                description: 'Desired amount of second token to add in decimal format',
            },
            {
                name: 'amount0Min',
                type: 'string',
                description: 'Minimum amount of first token to add (slippage protection) in decimal format',
            },
            {
                name: 'amount1Min',
                type: 'string',
                description: 'Minimum amount of second token to add (slippage protection) in decimal format',
            },
            {
                name: 'deadline',
                type: 'number',
                description: 'Unix timestamp deadline for the transaction',
                optional: true,
            },
        ],
    },
    {
        name: 'claimNftBribes',
        description: 'Claims all NFT bribe rewards earned from voting with a veNFT from Equalizer',
        required: ['chainName', 'account', 'tokenId', 'bribes', 'btokens'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim bribes',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that owns the veNFT',
            },
            {
                name: 'tokenId',
                type: 'number',
                description: 'ID of the veNFT',
            },
            {
                name: 'bribes',
                type: 'array',
                description: 'Array of bribe addresses to claim from',
            },
            {
                name: 'btokens',
                type: 'array',
                description: 'Array of arrays containing reward token addresses for each bribe',
            },
        ],
    },
    {
        name: 'claimAllRewards',
        description: 'Claims all rewards earned from voting with a veNFT, including gauge and bribe rewards from Equalizer',
        required: ['chainName', 'account', 'tokenId', 'gauges', 'gtokens', 'bribes', 'btokens'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim rewards',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that owns the veNFT',
            },
            {
                name: 'tokenId',
                type: 'number',
                description: 'ID of the veNFT',
            },
            {
                name: 'gauges',
                type: 'array',
                description: 'Array of gauge addresses to claim from',
            },
            {
                name: 'gtokens',
                type: 'array',
                description: 'Array of arrays containing reward token addresses for each gauge',
            },
            {
                name: 'bribes',
                type: 'array',
                description: 'Array of bribe addresses to claim from',
            },
            {
                name: 'btokens',
                type: 'array',
                description: 'Array of arrays containing reward token addresses for each bribe',
            },
        ],
    },
    {
        name: 'claimFarmReward',
        description: 'Claims rewards from Equalizer Concentrated Liquidity farm position',
        required: ['chainName', 'account', 'farmAddress', 'earnedAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim rewards',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim rewards',
            },
            {
                name: 'farmAddress',
                type: 'string',
                description: 'Address of the farm contract',
            },
            {
                name: 'earnedAddress',
                type: 'string',
                description: 'Address of the reward token',
            },
        ],
    },
    {
        name: 'claimLpFees',
        description: 'Claims accumulated trading fees from an Equalizer LP position',
        required: ['chainName', 'account', 'pairAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim fees',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim fees',
            },
            {
                name: 'pairAddress',
                type: 'string',
                description: 'Address of the LP pair contract',
            },
        ],
    },
    {
        name: 'claimLpReward',
        description: 'Claims rewards from an Equalizer gauge LP position',
        required: ['chainName', 'account', 'gaugeAddress', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to claim rewards',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will claim rewards',
            },
            {
                name: 'gaugeAddress',
                type: 'string',
                description: 'Address of the gauge contract',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the reward token to claim',
            },
        ],
    },
    {
        name: 'collectFeesFromThickNfpPosition',
        description: 'Collects accumulated fees from a Thick NFT Position',
        required: ['chainName', 'account', 'tokenId', 'nfpManagerAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to collect fees',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that owns the position',
            },
            {
                name: 'tokenId',
                type: 'number',
                description: 'ID of the position NFT',
            },
            {
                name: 'nfpManagerAddress',
                type: 'string',
                description: 'Address of the NFT Position Manager contract',
            },
        ],
    },
    {
        name: 'createGauge',
        description: 'Creates a new gauge for an Equalizer LP pair to enable rewards',
        required: ['chainName', 'account', 'pairAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to create gauge',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will create the gauge',
            },
            {
                name: 'pairAddress',
                type: 'string',
                description: 'Address of the LP pair',
            },
        ],
    },
    {
        name: 'createLiquidityPool',
        description: 'Creates a new Equalizer liquidity pool and adds initial liquidity',
        required: ['chainName', 'account', 'token0Address', 'token1Address', 'isStable', 'amount0Desired', 'amount1Desired', 'amount0Min', 'amount1Min'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to create pool',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will create the pool',
            },
            {
                name: 'token0Address',
                type: 'string',
                description: 'Address of the first token',
            },
            {
                name: 'token1Address',
                type: 'string',
                description: 'Address of the second token',
            },
            {
                name: 'isStable',
                type: 'boolean',
                description: 'Whether to create a stable or volatile pool',
            },
            {
                name: 'amount0Desired',
                type: 'string',
                description: 'Desired amount of first token in decimal format',
            },
            {
                name: 'amount1Desired',
                type: 'string',
                description: 'Desired amount of second token in decimal format',
            },
            {
                name: 'amount0Min',
                type: 'string',
                description: 'Minimum amount of first token in decimal format',
            },
            {
                name: 'amount1Min',
                type: 'string',
                description: 'Minimum amount of second token in decimal format',
            },
            {
                name: 'deadline',
                type: 'number',
                description: 'Unix timestamp deadline for the transaction',
                optional: true,
            },
        ],
    },
];
