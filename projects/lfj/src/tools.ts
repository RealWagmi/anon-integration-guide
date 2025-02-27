import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
    {
        name: 'swapTokens',
        description: 'Swap tokens using lfj.gg',
        required: ['chainName', 'account', 'amount', 'inputTokenAddress', 'outputTokenAddress', 'isExactIn', 'recipient', 'slippageTolerance'],
        props: [
            {
                name: 'isExactIn',
                type: 'boolean',
                description:
                    'Set this to `true` when the user wants to swap an exact amount of `inputTokenAddress` to `outputTokenAddress`. If the user wants an exact amount of `outputTokenAddress` then set this to `false`.',
            },
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the swap',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'An optional field to specify where the output token is received. This defaults to `account` set to null.',
            },
            {
                name: 'slippageTolerance',
                type: ['string', 'null'],
                description:
                    'An optional field to specify the maximum allowed slippage in percentage for swapping the tokens. If set to null this defaults to 0.5. This value should be in percentage (e.g. 0.5 for 0.5%)',
            },
            {
                name: 'inputTokenAddress',
                type: 'string',
                description: 'An ERC20 address of the token that will be used to sell in exchange for the `outputTokenAddress`',
            },
            {
                name: 'outputTokenAddress',
                type: 'string',
                description: 'An ERC20 address of the token that the user will receive after the swap.',
            },
        ],
    },
    {
        name: 'addLiquidity',
        description: 'Add liquidity to a pair.',
        required: ['account', 'chainName', 'tokenX', 'tokenY', 'tokenXAmount', 'tokenYAmount', 'distribution', 'binStep', 'allowedSlippageInPercentage'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'The wallet address of the user providing liquidity.',
            },
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'The name of the chain where liquidity is being added.',
            },
            {
                name: 'tokenX',
                type: 'string',
                description: 'The ERC20 token address of the first asset in the liquidity pair.',
            },
            {
                name: 'tokenY',
                type: 'string',
                description: 'The ERC20 token address of the second asset in the liquidity pair.',
            },
            {
                name: 'tokenXAmount',
                type: 'string',
                description: 'The amount of `tokenX` in decimal format that the user is adding to liquidity.',
            },
            {
                name: 'tokenYAmount',
                type: 'string',
                description: 'The amount of `tokenY` in decimal format that the user is adding to liquidity.',
            },
            {
                name: 'distribution',
                type: 'string',
                enum: ['spot', 'curve', 'bidask'],
                description: 'The distribution type for liquidity: `spot`, `curve`, or `bidask`.',
            },
            {
                name: 'binStep',
                type: 'number',
                description: 'Defines the bin step, determining the price increment between bins.',
            },
            {
                name: 'allowedSlippageInPercentage',
                type: 'string',
                description: 'The maximum allowed slippage percentage for the liquidity addition (e.g., "0.5" for 0.5%).',
            },
        ],
    },
    {
        name: 'removeLiquidity',
        description: 'Remove liquidity from a liquidity pair.',
        required: ['chainName', 'tokenX', 'tokenY', 'account', 'binStep'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'The wallet address of the user removing liquidity.',
            },
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'The name of the blockchain where liquidity is being removed.',
            },
            {
                name: 'tokenX',
                type: 'string',
                description: 'The ERC20 token address of the first asset in the liquidity pair.',
            },
            {
                name: 'tokenY',
                type: 'string',
                description: 'The ERC20 token address of the second asset in the liquidity pair.',
            },
            {
                name: 'binStep',
                type: 'number',
                description: 'Defines the bin step, determining the price increment between bins.',
            },
        ],
    },
];
