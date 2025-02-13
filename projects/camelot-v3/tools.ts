import { SUPPORTED_CHAINS } from './constants';
import { AiTool, getChainName } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'exactInputSingle',
        description: 'Swap exact amount of X tokens IN for token OUT receiving at least Y tokens OUT with at most Z slippage tolerance. Optionally send them to another recipient',
        required: ['chainName', 'account', 'tokenIn', 'tokenOut', 'amountIn', 'recipient', 'slippage'],
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
                description: 'Account address that will execute the swap',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token address to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token address to swap to',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount of token in to swap in decimal format',
            },
            {
                name: 'amountOutMin',
                type: 'string',
                description: 'Minimum expected amount of token out to receive in decimal format',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Recipient address to receive the swapped token out',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage tolerance in percentage. 10000 is 100%. Default is 0.2%, maximum 3%',
            },
        ],
    },
    {
        name: 'exactOutputSingle',
        description: 'Swap token IN for exact amount of X tokens OUT while spending at most Y tokens IN with at most Z slippage tolerance. Optionally send them to another recipient',
        required: ['chainName', 'account', 'tokenIn', 'tokenOut', 'amountOut', 'amountInMax', 'recipient', 'slippage'],
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
                description: 'Account address that will execute the swap',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token address to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token address to swap to',
            },
            {
                name: 'amountOut',
                type: 'string',
                description: 'Exact amount of token out to receive in decimal format',
            },
            {
                name: 'amountInMax',
                type: ['string', 'null'],
                description: 'Maximum amount of token in to spend in decimal format',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Recipient address to receive the swapped token out',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage tolerance in percentage. 10000 is 100%. Default is 0.2%, maximum 3%',
            },
        ],
    },
    {
        name: 'mint',
        description:
            'Add liquidity to a pool using tokens A and B by specifying the amounts of each token to provide with at most Z slippage tolerance. Optionally, you can define the liquidity range, either as absolute prices or as percentages relative to the current price. You can also choose to send the position NFT to another recipient. In certain cases, this functionality can be leveraged to place a limit order at a specific price or within a defined price range.',
        required: ['chainName', 'account', 'tokenA', 'tokenB', 'amountA', 'amountB', 'amountAMin', 'amountBMin', 'lowerPrice', 'upperPrice', 'lowerPricePercentage', 'upperPricePercentage', 'recipient', 'slippage'],
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
                description: 'Account address that will execute the mint',
            },
            {
                name: 'tokenA',
                type: 'string',
                description: 'Token A address to add liquidity',
            },
            {
                name: 'tokenB',
                type: 'string',
                description: 'Token B address to add liquidity',
            },
            {
                name: 'amountA',
                type: 'string',
                description: 'Amount of token A to add in decimal format',
            },
            {
                name: 'amountB',
                type: 'string',
                description: 'Amount of token B to add in decimal format',
            },
            {
                name: 'amountAMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token A to add in decimal format',
            },
            {
                name: 'amountBMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token B to add in decimal format',
            },
            {
                name: 'lowerPrice',
                type: ['string', 'null'],
                description: 'Lower price range for adding liquidity (provided as token1 / token0)',
            },
            {
                name: 'upperPrice',
                type: ['string', 'null'],
                description: 'Upper price range for adding liquidity  (provided as token1 / token0)',
            },
            {
                name: 'lowerPricePercentage',
                type: ['number', 'null'],
                description: 'Lower price percentage (from current pool price) for adding liquidity. 10000 is 100%',
            },
            {
                name: 'upperPricePercentage',
                type: ['number', 'null'],
                description: 'Upper price percentage (from current pool price) for adding liquidity. 10000 is 100%',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Recipient address to receive the position NFT',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage tolerance in percentage. 10000 is 100%. Default is 0.2%',
            },
        ],
    },
    {
        name: 'collect',
        description: 'Collect fees from a liquidity position on Camelot V3. If you have multiple positions, ensure you specify the position ID to collect fees from the correct one. You can also optionally define the percentage of fees to collect or set a maximum amount to be collected.',
        required: ['chainName', 'account', 'tokenA', 'tokenB', 'tokenId', 'collectPercentage', 'amountAMax', 'amountBMax', 'recipient'],
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
                description: 'Account address that will collect the fees',
            },
            {
                name: 'tokenA',
                type: 'string',
                description: 'Token A address of the liquidity position',
            },
            {
                name: 'tokenB',
                type: 'string',
                description: 'Token B address of the liquidity position',
            },
            {
                name: 'tokenId',
                type: ['number', 'null'],
                description: 'Specific position ID to collect fees from',
            },
            {
                name: 'collectPercentage',
                type: ['number', 'null'],
                description: 'Percentage of fees to collect. 10000 is 100%. Default is 100%',
            },
            {
                name: 'amountAMax',
                type: ['string', 'null'],
                description: 'Maximum amount of token A to collect in decimal format',
            },
            {
                name: 'amountBMax',
                type: ['string', 'null'],
                description: 'Maximum amount of token B to collect in decimal format',
            },
            {
                name: 'recipient',
                type: ['string', 'null'],
                description: 'Recipient address to receive the collected fees',
            },
        ],
    },
    {
        name: 'decreaseLiquidity',
        description: 'Decrease the percentage of liquidity from a position on Camelot V3. If you have multiple positions, ensure you specify the position ID to decrease liquidity from the correct one. You can also optionally define the minimum amounts to receive.',
        required: ['chainName', 'account', 'tokenA', 'tokenB', 'decreasePercentage', 'tokenId', 'amountAMin', 'amountBMin'],
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
                description: 'Account address that will execute the decrease liquidity',
            },
            {
                name: 'tokenA',
                type: 'string',
                description: 'Token A address of the liquidity position',
            },
            {
                name: 'tokenB',
                type: 'string',
                description: 'Token B address of the liquidity position',
            },
            {
                name: 'decreasePercentage',
                type: 'number',
                description: 'Percentage of liquidity to remove. 10000 is 100%',
            },
            {
                name: 'tokenId',
                type: ['number', 'null'],
                description: 'Specific position ID to decrease liquidity from',
            },
            {
                name: 'amountAMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token A to receive in decimal format',
            },
            {
                name: 'amountBMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token B to receive in decimal format',
            },
        ],
    },
    {
        name: 'increaseLiquidity',
        description: 'Increase liquidity in a position on Camelot V3 with at most Z slippage tolerance. If you have multiple positions, ensure you specify the position ID to increase liquidity in the correct one. You can also optionally define the minimum amounts to provide.',
        required: ['chainName', 'account', 'tokenA', 'tokenB', 'amountA', 'amountB', 'tokenId', 'amountAMin', 'amountBMin', 'slippage'],
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
                description: 'Account address that will execute the increase liquidity',
            },
            {
                name: 'tokenA',
                type: 'string',
                description: 'Token A address of the liquidity position',
            },
            {
                name: 'tokenB',
                type: 'string',
                description: 'Token B address of the liquidity position',
            },
            {
                name: 'amountA',
                type: 'string',
                description: 'Amount of token A to add in decimal format',
            },
            {
                name: 'amountB',
                type: 'string',
                description: 'Amount of token B to add in decimal format',
            },
            {
                name: 'tokenId',
                type: ['number', 'null'],
                description: 'Specific position ID to increase liquidity for',
            },
            {
                name: 'amountAMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token A to add in decimal format',
            },
            {
                name: 'amountBMin',
                type: ['string', 'null'],
                description: 'Minimum amount of token B to add in decimal format',
            },
            {
                name: 'slippage',
                type: 'number',
                description: 'Slippage tolerance in percentage. 10000 is 100%. Default is 0.2%',
            },
        ],
    },
    {
        name: 'getLPPositions',
        description: 'Retrieve LP positions for a given account on Camelot V3. Optionally, filter by tokens.',
        required: ['chainName', 'account', 'tokenA', 'tokenB'],
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
                description: 'Account address to query LP positions for',
            },
            {
                name: 'tokenA',
                type: ['string', 'null'],
                description: 'Optional token A address to filter LP positions',
            },
            {
                name: 'tokenB',
                type: ['string', 'null'],
                description: 'Optional token B address to filter LP positions',
            },
        ],
    },
    {
        name: 'quoteExactInputSingle',
        description: 'Get a quote for swapping an exact amount of token A for token B on Camelot V3.',
        required: ['chainName', 'tokenIn', 'tokenOut', 'amountIn'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token address to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token address to swap to',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount of token in to swap in decimal format',
            },
        ],
    },
    {
        name: 'quoteExactOutputSingle',
        description: 'Get a quote for swapping token A for an exact amount of token B on Camelot V3.',
        required: ['chainName', 'tokenIn', 'tokenOut', 'amountOut'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: SUPPORTED_CHAINS.map(getChainName),
                description: 'Chain name where to execute',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Token address to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Token address to swap to',
            },
            {
                name: 'amountOut',
                type: 'string',
                description: 'Exact amount of token out to receive in decimal format',
            },
        ],
    }
];
