import { type AiTool, getChainName } from '@heyanon/sdk';
import { SUPPORTED_CHAINS } from './constants';

export const tools: AiTool[] = [
    {
        name: 'exactInputSingle',
        description:
            'Swap a specific amount of token A for token B, ensuring a minimum amount of token B is received. Optionally, send the output to another recipient.',
        required: [
            'chainName',
            'account',
            'tokenIn',
            'tokenOut',
            'amountIn',
            'amountOutMin',
            'recipient',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address executing the swap.',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token being swapped from.',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token being swapped to.',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount of token in to swap in decimal format.',
            },
            {
                name: 'amountOutMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token out to receive in decimal format.',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Address receiving the swapped tokens.',
            },
        ],
    },
    {
        name: 'exactOutputSingle',
        description:
            'Swap token A for a precise amount of token B, spending no more than a defined maximum. The output can be sent to another address.',
        required: [
            'chainName',
            'account',
            'tokenIn',
            'tokenOut',
            'amountOut',
            'amountInMax',
            'recipient',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address executing the swap.',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token being swapped from.',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token being swapped to.',
            },
            {
                name: 'amountOut',
                type: 'string',
                description: 'Exact amount of token out to receive in decimal format.',
            },
            {
                name: 'amountInMax',
                type: ['string', 'null'],
                description: 'Maximum amount of token in to spend in decimal format.',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Address receiving the swapped tokens.',
            },
        ],
    },
    {
        name: 'mint',
        description:
            'Add liquidity to a pool with tokens A and B. You can specify liquidity ranges using absolute prices or percentages and optionally send the position NFT to another address.',
        required: [
            'chainName',
            'account',
            'tokenAAddress',
            'tokenBAddress',
            'amountA',
            'amountB',
            'slippageTolerance',
            'lowerPrice',
            'upperPrice',
            'lowerPricePercentage',
            'upperPricePercentage',
            'recipient',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address providing liquidity.',
            },
            {
                name: 'tokenAAddress',
                type: 'string',
                description: 'Address of token A.',
            },
            {
                name: 'tokenBAddress',
                type: 'string',
                description: 'Address of token B.',
            },
            {
                name: 'tickSpacing',
                type: 'number',
                description: 'Tick spacing of the pool in bps.',
            },
            {
                name: 'amountA',
                type: 'string',
                description: 'Amount of token A to provide in decimal format.',
            },
            {
                name: 'amountB',
                type: 'string',
                description: 'Amount of token B to provide in decimal format.',
            },
            {
                name: 'slippageTolerance',
                type: 'number',
                description: 'Slippage tolerance in percentage (e.g., 5.0).',
            },
            {
                name: 'lowerPrice',
                type: ['string', 'null'],
                description: 'Lower price range (provided as tokenB/tokenA).',
            },
            {
                name: 'upperPrice',
                type: ['string', 'null'],
                description: 'Upper price range (provided as tokenB/tokenA).',
            },
            {
                name: 'lowerPricePercentage',
                type: ['number', 'null'],
                description: 'Lower price as a percentage of the current price.',
            },
            {
                name: 'upperPricePercentage',
                type: ['number', 'null'],
                description: 'Upper price as a percentage of the current price.',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Address receiving the position NFT.',
            },
        ],
    },
    {
        name: 'collect',
        description:
            'Withdraw fees from a liquidity position, specifying a position ID, percentages, or maximum amounts if needed.',
        required: [
            'chainName',
            'account',
            'tokenAAddress',
            'tokenBAddress',
            'collectPercentage',
            'amountAMax',
            'amountBMax',
            'recipient',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address collecting fees.',
            },
            {
                name: 'tokenAAddress',
                type: 'string',
                description: 'Token A associated with the position.',
            },
            {
                name: 'tokenBAddress',
                type: 'string',
                description: 'Token B associated with the position.',
            },
            {
                name: 'tokenId',
                type: 'number',
                description: 'ID of the position to collect fees from.',
            },
            {
                name: 'collectPercentage',
                type: ['number', 'null'],
                description: 'Percentage of fees to collect.',
            },
            {
                name: 'amountAMax',
                type: ['string', 'null'],
                description: 'Maximum token A to collect in decimal format.',
            },
            {
                name: 'amountBMax',
                type: ['string', 'null'],
                description: 'Maximum token B to collect in decimal format.',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Address receiving the collected fees.',
            },
        ],
    },
    {
        name: 'decreaseLiquidity',
        description:
            'Reduce liquidity in a position, defining a percentage to remove and optional minimum output amounts.',
        required: [
            'chainName',
            'account',
            'tokenAAddress',
            'tokenBAddress',
            'decreasePercentage',
            'tokenId',
            'slippageTolerance',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address reducing liquidity.',
            },
            {
                name: 'tokenAAddress',
                type: 'string',
                description: 'Token A linked to the position.',
            },
            {
                name: 'tokenBAddress',
                type: 'string',
                description: 'Token B linked to the position.',
            },
            {
                name: 'decreasePercentage',
                type: 'number',
                description: 'Percentage of liquidity to remove, between 0 and 100.',
            },
            {
                name: 'tokenId',
                type: ['number', 'null'],
                description: 'ID of the position.',
            },
            {
                name: 'slippageTolerance',
                type: ['number', 'null'],
                description: 'Slippage tolerance in percentage (e.g., 5.0).',
            },
        ],
    },
    {
        name: 'increaseLiquidity',
        description:
            'Add liquidity to an existing position, specifying token amounts and optional minimum values.',
        required: [
            'chainName',
            'account',
            'tokenAAddress',
            'tokenBAddress',
            'amountA',
            'amountB',
        ],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address adding liquidity.',
            },
            {
                name: 'tokenAAddress',
                type: 'string',
                description: 'Address of token A.',
            },
            {
                name: 'tokenBAddress',
                type: 'string',
                description: 'Address of token B.',
            },
            {
                name: 'amountA',
                type: 'string',
                description: 'Amount of token A to add in decimal format.',
            },
            {
                name: 'amountB',
                type: 'string',
                description: 'Amount of token B to add in decimal format.',
            },
            {
                name: 'tokenId',
                type: ['number', 'null'],
                description: 'ID of the position.',
            },
            {
                name: 'slippageTolerance',
                type: ['number', 'null'],
                description: 'Slippage tolerance in percentage (e.g., 5.0).',
            },
        ],
    },
    {
        name: 'getLPPositions',
        description:
            'Retrieve LP positions for a specific account, with optional token filters.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address querying positions.',
            },
            {
                name: 'tokens',
                type: 'array',
                items: {
                    type: 'string',
                },
                description: 'Get only positions with any of the specified tokens.',
            },
        ],
    },
];
