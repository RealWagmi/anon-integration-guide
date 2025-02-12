import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'claimAsset',
        description: 'Claims asset from the Upshift vault after requesting redeem',
        required: ['chainName', 'account', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute claim',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the claim',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Asset that will be claimed',
            },
        ],
    },
    {
        name: 'depositAsset',
        description: 'Deposits asset into the Upshift vault',
        required: ['chainName', 'account', 'amount', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute deposit',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the deposit',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens that will be deposited',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Asset that will be deposited',
            },
        ],
    },
    {
        name: 'requestRedeemAsset',
        description: 'Requests redeem of an asset from the Upshift vault',
        required: ['chainName', 'account', 'amount', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute redeem request',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the redeem request',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens that will be redeemed',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Asset that will be redeemed',
            },
        ],
    },
    {
        name: 'stakeOnAvalanche',
        description: 'Stakes AVAX or AUSD into the Upshift vault on Avalanche network',
        required: ['chainName', 'account', 'amount', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute stake',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the stake',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens that will be staked',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Asset that will be staked',
            },
        ],
    },
    {
        name: 'unstakeOnAvalanche',
        description: 'Unstakes AVAX or AUSD from the Upshift vault on Avalanche network',
        required: ['chainName', 'account', 'amount', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute unstake',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the unstake',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens that will be unstaked',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Asset that will be unstaked',
            },
        ],
    },
    {
        name: 'redeemRewardOnAvalanche',
        description: 'Redeems rewards from Upshift LP (liquidity pool) on Avalanche network',
        required: ['chainName', 'account', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute reward redeem',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the redeem',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Asset vault that will be redeem rewards from',
            },
        ],
    },
    {
        name: 'getVaultApy',
        description: 'Fetches APY (annual percentage yield) for a given vault',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where vault is deployed',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Underlying asset for a vault to fetch APY from',
            },
        ],
    },
    {
        name: 'getVaultRewards',
        description: 'Fetches additional rewards (points) for a given vault',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where vault is deployed',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Underlying asset for a vault to fetch rewards from',
            },
        ],
    },
    {
        name: 'getVaultTvl',
        description: 'Fetches TLV (total value locked) for a given vault',
        required: ['chainName', 'token'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where vault is deployed',
            },
            {
                name: 'token',
                type: 'string',
                description: 'Underlying asset for a vault to fetch TVL from',
            },
        ],
    },
    {
        name: 'getTvl',
        description: 'Fetches TVL (total value locked) in the protocol',
        required: [],
        props: [],
    },
];
