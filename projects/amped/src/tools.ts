import { AiTool, getChainName } from '@heyanon/sdk';
import { NETWORKS, supportedChains } from './constants.js';
import { addLiquidity } from './functions/liquidity/addLiquidity.js';
import { removeLiquidity } from './functions/liquidity/removeLiquidity.js';
import { getPerpsLiquidity } from './functions/trading/leverage/getPerpsLiquidity.js';
import { getPosition } from './functions/trading/leverage/getPosition.js';
import { getALPAPR } from './functions/liquidity/getALPAPR.js';
import { getUserTokenBalances } from './functions/liquidity/getUserTokenBalances.js';
import { getUserLiquidity } from './functions/liquidity/getUserLiquidity.js';
import { getPoolLiquidity } from './functions/liquidity/getPoolLiquidity.js';
import { closePosition } from './functions/trading/leverage/closePosition.js';
import { claimRewards } from './functions/liquidity/claimRewards.js';
import { getEarnings } from './functions/liquidity/getEarnings.js';
import { marketSwap } from './functions/trading/swaps/marketSwap.js';
import { getSwapsLiquidity } from './functions/trading/swaps/getSwapsLiquidity.js';
import { openPosition } from './functions/trading/leverage/openPosition.js';
import { getAllOpenPositions } from './functions/trading/leverage/getAllOpenPositions.js';

// Helper to generate enum based on supported chains
const supportedChainNames = supportedChains.map(chainId => getChainName(chainId));

// Define token lists for descriptions
const sonicTokens = '(S, WETH, ANON, USDC)';
const baseTokens = ' (ETH, WETH, CBBTC, USDC, VIRTUAL)'; // Added VIRTUAL
const allTokens = sonicTokens + baseTokens;

// Internal interface for our implementation needs
interface Tool extends AiTool {
    name: string;
    description: string;
    function: Function;
    // Props is used internally by our SDK
    props: Array<{
        name: string;
        type: string;
        description: string;
        enum?: string[];
        optional?: boolean;
    }>;
    required: string[];
    // Parameters follows OpenAI's function calling standard
    parameters: {
        type: 'object';
        properties: {
            [key: string]: {
                type: string;
                description: string;
                enum?: string[];
            };
        };
        required: string[];
    };
}

export const tools: Tool[] = [
    {
        name: 'addLiquidity',
        description: 'Add liquidity to the protocol by providing tokens in exchange for GLP. You must specify either amount or percentOfBalance.',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the transaction',
            },
            {
                name: 'tokenSymbol',
                type: 'string',
                description: `Symbol of the token to provide as liquidity. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Exact amount of tokens to provide as liquidity. Required if percentOfBalance is not provided.',
            },
            {
                name: 'percentOfBalance',
                type: 'number',
                description: 'Percentage of your token balance to use (1-100). Required if amount is not provided.',
            },
            {
                name: 'minUsdg',
                type: 'string',
                description: 'Minimum USDG to receive in decimal format (e.g., "1.5" for 1.5 USDG). Uses 18 decimals. Defaults to "0" if not specified.',
            },
            {
                name: 'minGlp',
                type: 'string',
                description: 'Minimum GLP to receive in decimal format (e.g., "1.5" for 1.5 GLP). Uses 18 decimals. Defaults to "0" if not specified.',
            },
        ],
        required: ['chainName', 'account', 'tokenSymbol', 'minUsdg', 'minGlp'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address that will execute the transaction',
                },
                tokenSymbol: {
                    type: 'string',
                    description: `Symbol of the token to provide as liquidity. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
                },
                amount: {
                    type: 'string',
                    description: 'Exact amount of tokens to provide as liquidity. Required if percentOfBalance is not provided.',
                },
                percentOfBalance: {
                    type: 'number',
                    description: 'Percentage of your token balance to use (1-100). Required if amount is not provided.',
                },
                minUsdg: {
                    type: 'string',
                    description: 'Minimum USDG to receive in decimal format (e.g., "1.5" for 1.5 USDG). Uses 18 decimals. Defaults to "0" if not specified.',
                },
                minGlp: {
                    type: 'string',
                    description: 'Minimum GLP to receive in decimal format (e.g., "1.5" for 1.5 GLP). Uses 18 decimals. Defaults to "0" if not specified.',
                },
            },
            required: ['chainName', 'account', 'tokenSymbol', 'minUsdg', 'minGlp'],
        },
        function: addLiquidity,
    },
    {
        name: 'removeLiquidity',
        description:
            'Remove liquidity from the protocol by redeeming GLP for tokens. For native token (Sonic: S, Base: ETH) redemption, use the NATIVE_TOKEN address from CONTRACT_ADDRESSES for the respective chain. The minimum output amount is calculated automatically based on current prices and slippage tolerance.',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will receive the redeemed tokens',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Address of the token to receive when removing liquidity. Use NATIVE_TOKEN address for native token (S/ETH) redemption.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of GLP to redeem (in decimal format)',
            },
            {
                name: 'slippageTolerance',
                type: 'number',
                description: 'Maximum acceptable slippage as a percentage (e.g., 0.5 for 0.5%). Defaults to 0.5%.',
            },
            {
                name: 'skipSafetyChecks',
                type: 'boolean',
                description: 'Skip balance and liquidity verification checks',
                optional: true,
            },
        ],
        required: ['chainName', 'account', 'tokenOut', 'amount', 'slippageTolerance'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address that will receive the redeemed tokens',
                },
                tokenOut: {
                    type: 'string',
                    description: 'Address of the token to receive when removing liquidity. Use NATIVE_TOKEN address for native token (S/ETH) redemption.',
                },
                amount: {
                    type: 'string',
                    description: 'Amount of GLP to redeem (in decimal format)',
                },
                slippageTolerance: {
                    type: 'number',
                    description: 'Maximum acceptable slippage as a percentage (e.g., 0.5 for 0.5%). Defaults to 0.5%.',
                },
                skipSafetyChecks: {
                    type: 'boolean',
                    description: 'Skip balance and liquidity verification checks',
                },
            },
            required: ['chainName', 'account', 'tokenOut', 'amount', 'slippageTolerance'],
        },
        function: removeLiquidity,
    },
    {
        name: 'getPerpsLiquidity',
        description: 'Get perpetual trading liquidity information for a token, including max leverage, position sizes, and funding rates',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check liquidity for',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token to trade',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token to use as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to check long or short position liquidity',
            },
        ],
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check liquidity for',
                },
                indexToken: {
                    type: 'string',
                    description: 'Address of the token to trade',
                },
                collateralToken: {
                    type: 'string',
                    description: 'Address of the token to use as collateral',
                },
                isLong: {
                    type: 'boolean',
                    description: 'Whether to check long or short position liquidity',
                },
            },
            required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
        },
        function: getPerpsLiquidity,
    },
    {
        name: 'getALPAPR',
        description: 'Get APR information for ALP (Amped Liquidity Provider) tokens, including base APR and reward rates',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (currently likely Sonic only)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check APR for',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'The ALP token address to check APR for',
            },
        ],
        required: ['chainName', 'account', 'tokenAddress'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (currently likely Sonic only)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check APR for',
                },
                tokenAddress: {
                    type: 'string',
                    description: 'The ALP token address to check APR for',
                },
            },
            required: ['chainName', 'account', 'tokenAddress'],
        },
        function: getALPAPR,
    },
    {
        name: 'getUserTokenBalances',
        description: 'Get balances and USD values of all supported tokens for a specific user',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check token balances for',
            },
        ],
        required: ['chainName', 'account'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check token balances for',
                },
            },
            required: ['chainName', 'account'],
        },
        function: getUserTokenBalances,
    },
    {
        name: 'getUserLiquidity',
        description: "Get user's ALP (Amped Liquidity Provider) information including balance, USD value, and unclaimed rewards",
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (currently likely Sonic only)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check liquidity for',
            },
        ],
        required: ['chainName', 'account'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (currently likely Sonic only)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check liquidity for',
                },
            },
            required: ['chainName', 'account'],
        },
        function: getUserLiquidity,
    },
    {
        name: 'getPoolLiquidity',
        description: 'Get total pool liquidity information including GLP supply and Assets Under Management (AUM)',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
        ],
        required: ['chainName'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
            },
            required: ['chainName'],
        },
        function: getPoolLiquidity,
    },
    {
        name: 'getPosition',
        description: "Get details of a user's perpetual trading position including size, collateral, PnL, and other metrics",
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check position for',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token being traded',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token used as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether this is a long position (true) or short position (false)',
            },
        ],
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check position for',
                },
                indexToken: {
                    type: 'string',
                    description: 'Address of the token being traded',
                },
                collateralToken: {
                    type: 'string',
                    description: 'Address of the token used as collateral',
                },
                isLong: {
                    type: 'boolean',
                    description: 'Whether this is a long position (true) or short position (false)',
                },
            },
            required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
        },
        function: getPosition,
    },
    {
        name: 'closePosition',
        description: 'Close one or more leveraged positions on Amped Finance. Can close specific positions or all matching positions.',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that owns the position(s)',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Optional address of the token being traded. If not provided, closes positions for all tokens.',
                optional: true,
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Optional address of the token used as collateral. If not provided, closes positions with any collateral.',
                optional: true,
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Optional position type. If not provided, closes both long and short positions.',
                optional: true,
            },
            {
                name: 'sizeDelta',
                type: 'string',
                description: 'Optional amount to close (in USD, with 30 decimals). If not provided, closes entire position.',
                optional: true,
            },
            {
                name: 'slippageBps',
                type: 'number',
                description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 30.',
            },
            {
                name: 'withdrawETH',
                type: 'boolean',
                description: 'Whether to withdraw in native token (S/ETH) instead of wrapped token. Defaults to false.',
                optional: true,
            },
        ],
        required: ['chainName', 'account', 'slippageBps'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address that owns the position(s)',
                },
                indexToken: {
                    type: 'string',
                    description: 'Optional address of the token being traded. If not provided, closes positions for all tokens.',
                },
                collateralToken: {
                    type: 'string',
                    description: 'Optional address of the token used as collateral. If not provided, closes positions with any collateral.',
                },
                isLong: {
                    type: 'boolean',
                    description: 'Optional position type. If not provided, closes both long and short positions.',
                },
                sizeDelta: {
                    type: 'string',
                    description: 'Optional amount to close (in USD, with 30 decimals). If not provided, closes entire position.',
                },
                slippageBps: {
                    type: 'number',
                    description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 30.',
                },
                withdrawETH: {
                    type: 'boolean',
                    description: 'Whether to withdraw in native token (S/ETH) instead of wrapped token. Defaults to false.',
                },
            },
            required: ['chainName', 'account', 'slippageBps'],
        },
        function: closePosition,
    },
    {
        name: 'claimRewards',
        description: 'Claim earned rewards from providing liquidity to the protocol',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (currently likely Sonic only)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to claim rewards for',
            },
        ],
        required: ['chainName', 'account'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (currently likely Sonic only)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to claim rewards for',
                },
            },
            required: ['chainName', 'account'],
        },
        function: claimRewards,
    },
    {
        name: 'getEarnings',
        description: 'Get information about earnings from providing liquidity, including rewards and fees',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (currently likely Sonic only)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check earnings for',
            },
        ],
        required: ['chainName', 'account'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (currently likely Sonic only)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check earnings for',
                },
            },
            required: ['chainName', 'account'],
        },
        function: getEarnings,
    },
    {
        name: 'marketSwap',
        description: 'Execute a market swap between two tokens',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address executing the swap',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: `Token symbol to swap from. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: `Token symbol to swap to. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount of input token to swap',
            },
            {
                name: 'slippageBps',
                type: 'number',
                description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 100.',
            },
        ],
        required: ['chainName', 'account', 'tokenIn', 'tokenOut', 'amountIn', 'slippageBps'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address executing the swap',
                },
                tokenIn: {
                    type: 'string',
                    description: `Token symbol to swap from. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
                },
                tokenOut: {
                    type: 'string',
                    description: `Token symbol to swap to. Sonic: ${sonicTokens}, Base: ${baseTokens}`,
                },
                amountIn: {
                    type: 'string',
                    description: 'Amount of input token to swap',
                },
                slippageBps: {
                    type: 'number',
                    description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 100.',
                },
            },
            required: ['chainName', 'account', 'tokenIn', 'tokenOut', 'amountIn', 'slippageBps'],
        },
        function: marketSwap,
    },
    {
        name: 'getSwapsLiquidity',
        description: 'Get information about available liquidity for token swaps',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check liquidity for',
            },
        ],
        required: ['chainName', 'account'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check liquidity for',
                },
            },
            required: ['chainName', 'account'],
        },
        function: getSwapsLiquidity,
    },
    {
        name: 'openPosition',
        description: 'Open a new leveraged position for perpetual trading',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will own the position',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token to trade',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token to use as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to open a long position (true) or short position (false)',
            },
            {
                name: 'sizeUsd',
                type: 'number',
                description: 'Size of the position in USD (minimum $11)',
            },
            {
                name: 'collateralUsd',
                type: 'number',
                description: 'Amount of collateral in USD (minimum $10)',
            },
            {
                name: 'slippageBps',
                type: 'number',
                description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 30.',
            },
            {
                name: 'referralCode',
                type: 'string',
                description: 'Optional referral code',
                optional: true,
            },
        ],
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong', 'sizeUsd', 'collateralUsd', 'slippageBps'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address that will own the position',
                },
                indexToken: {
                    type: 'string',
                    description: 'Address of the token to trade',
                },
                collateralToken: {
                    type: 'string',
                    description: 'Address of the token to use as collateral',
                },
                isLong: {
                    type: 'boolean',
                    description: 'Whether to open a long position (true) or short position (false)',
                },
                sizeUsd: {
                    type: 'number',
                    description: 'Size of the position in USD (minimum $11)',
                },
                collateralUsd: {
                    type: 'number',
                    description: 'Amount of collateral in USD (minimum $10)',
                },
                slippageBps: {
                    type: 'number',
                    description: 'Slippage tolerance in basis points (1 bps = 0.01%). Defaults to 30.',
                },
                referralCode: {
                    type: 'string',
                    description: 'Optional referral code',
                },
            },
            required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong', 'sizeUsd', 'collateralUsd', 'slippageBps'],
        },
        function: openPosition,
    },
    {
        name: 'getAllOpenPositions',
        description: 'Gets all open perpetual trading positions for an account',
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChainNames,
                description: 'Name of the blockchain network (sonic or base)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check positions for',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to check long positions (false for short positions)',
            },
        ],
        required: ['chainName', 'account', 'isLong'],
        parameters: {
            type: 'object',
            properties: {
                chainName: {
                    type: 'string',
                    enum: supportedChainNames,
                    description: 'Name of the blockchain network (sonic or base)',
                },
                account: {
                    type: 'string',
                    description: 'Account address to check positions for',
                },
                isLong: {
                    type: 'boolean',
                    description: 'Whether to check long positions (false for short positions)',
                },
            },
            required: ['chainName', 'account', 'isLong'],
        },
        function: getAllOpenPositions,
    },
];
