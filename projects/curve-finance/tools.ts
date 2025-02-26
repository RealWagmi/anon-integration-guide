import { AiTool, AiToolProps, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'swap',
        description: 'Swap tokens using Curve StableSwapNG pool. Allows token exchange with specified slippage protection.',
        required: ['chainName', 'poolAddress', 'fromToken', 'toToken', 'amount', 'slippage', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'fromToken',
                description: 'Index of the token to sell (i)',
                type: 'number'
            },
            {
                name: 'toToken',
                description: 'Index of the token to buy (j)',
                type: 'number'
            },
            {
                name: 'amount',
                description: 'Amount of tokens to swap in decimal format',
                type: 'string'
            },
            {
                name: 'slippage',
                description: 'Maximum allowed slippage percentage (e.g., "0.5" for 0.5%)',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will execute the swap',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'addLiquidity',
        description: 'Add liquidity to Curve StableSwapNG pool. Deposits multiple tokens and receives LP tokens in return.',
        required: ['chainName', 'poolAddress', 'amounts', 'slippage', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to add liquidity',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'amounts',
                description: 'Array of token amounts to deposit in decimal format, matching pool token order',
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            {
                name: 'slippage',
                description: 'Maximum allowed slippage percentage (e.g., "0.5" for 0.5%)',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will provide liquidity',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'removeLiquidity',
        description: `Remove liquidity from Curve StableSwapNG pool. Supports chains: ${supportedChains.map(getChainName).join(', ')}`,
        required: ['chainName', 'poolAddress', 'lpAmount', 'minAmounts', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to remove liquidity',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'lpAmount',
                description: 'Amount of LP tokens to burn',
                type: 'string'
            },
            {
                name: 'minAmounts',
                description: 'Array of minimum token amounts to receive, matching pool token order',
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will remove liquidity',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'removeLiquidityOneCoin',
        description: `Remove liquidity from Curve StableSwapNG pool and receive a single token. Supports chains: ${supportedChains.map(getChainName).join(', ')}`,
        required: ['chainName', 'poolAddress', 'lpAmount', 'tokenIndex', 'minAmount', 'userAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to remove liquidity',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'lpAmount',
                description: 'Amount of LP tokens to burn',
                type: 'string'
            },
            {
                name: 'tokenIndex',
                description: 'Index of the token to receive',
                type: 'number'
            },
            {
                name: 'minAmount',
                description: 'Minimum amount of tokens to receive',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'User wallet address that will remove liquidity',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'getVirtualPrice',
        description: `Get the virtual price of a Curve StableSwapNG pool. The virtual price represents the theoretical value of the LP token in USD and increases as the pool earns fees. Supports chains: ${supportedChains.map(getChainName).join(', ')}`,
        required: ['chainName', 'poolAddress'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the pool is deployed',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'getExchangeRate',
        description: `Calculate the exchange rate between two tokens in a Curve StableSwapNG pool, including expected output amount and fees. Supports chains: ${supportedChains.map(getChainName).join(', ')}`,
        required: ['chainName', 'poolAddress', 'fromToken', 'toToken', 'amount'],
        props: [
            {
                name: 'chainName',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the pool is deployed',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'fromToken',
                description: 'Index of the input token',
                type: 'number'
            },
            {
                name: 'toToken',
                description: 'Index of the output token',
                type: 'number'
            },
            {
                name: 'amount',
                description: 'Amount of input tokens to calculate exchange rate for',
                type: 'string'
            }
        ],
        strict: true
    },
    {
        name: 'getLPTokenBalance',
        description: `Get a user's LP token balance and pool share information for a Curve StableSwapNG pool. Returns balance, share percentage, and estimated USD value. Supports chains: ${supportedChains.map(getChainName).join(', ')}`,
        required: ['chainName', 'poolAddress', 'userAddress'],
        props: [
            {
                name: 'chainName',
                description: 'Chain name where the pool is deployed',
                type: 'string'
            },
            {
                name: 'poolAddress',
                description: 'Address of the Curve StableSwapNG pool',
                type: 'string'
            },
            {
                name: 'userAddress',
                description: 'Address of the user to check balance for',
                type: 'string'
            }
        ],
        strict: true
    }
];