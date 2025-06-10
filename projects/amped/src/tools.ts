import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants.js';

const { getChainName } = EVM.utils;
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

// Define token enums per chain
const sonicTokens = ['S', 'WS', 'WETH', 'Anon', 'USDC', 'scUSD', 'STS'];
const baseTokens = ['ETH', 'WETH', 'CBBTC', 'USDC', 'VIRTUAL'];
const allTokens = [...new Set([...sonicTokens, ...baseTokens])]; // Combined unique tokens

// Tool definitions following SDK pattern

export const tools: AiTool[] = [
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
                enum: allTokens,
                description: 'Symbol of the token to provide as liquidity',
            },
            {
                name: 'amount',
                type: ['string', 'null'],
                description: 'Exact amount of tokens to provide as liquidity. Required if percentOfBalance is not provided.',
            },
            {
                name: 'percentOfBalance',
                type: ['number', 'null'],
                description: 'Percentage of your token balance to use (1-100). Required if amount is not provided.',
            },
            {
                name: 'minUsdg',
                type: 'string',
                description: 'Minimum USDG to receive (e.g., "1.5" for 1.5 USDG). Defaults to "0".',
                optional: true
            },
            {
                name: 'minGlp',
                type: 'string',
                description: 'Minimum GLP to receive (e.g., "1.5" for 1.5 GLP). Defaults to "0".',
                optional: true
            },
        ],
        required: ['chainName', 'account', 'tokenSymbol'],
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
                name: 'tokenOutSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token to receive when removing liquidity',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of GLP to redeem',
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
        required: ['chainName', 'account', 'tokenOutSymbol', 'amount', 'slippageTolerance'],
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
                name: 'tokenSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token to trade',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to check long or short position liquidity',
            },
        ],
        required: ['chainName', 'account', 'tokenSymbol', 'isLong'],
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
        ],
        required: ['chainName', 'account'],
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
                name: 'tokenSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token being traded',
            },
            {
                name: 'collateralTokenSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token used as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether this is a long position (true) or short position (false)',
            },
        ],
        required: ['chainName', 'account', 'tokenSymbol', 'collateralTokenSymbol', 'isLong'],
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
                description: 'Optional amount to close in USD (e.g., "100" for $100). If not provided, closes entire position.',
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
                enum: allTokens,
                description: 'Token symbol to swap from',
            },
            {
                name: 'tokenOut',
                type: 'string',
                enum: allTokens,
                description: 'Token symbol to swap to',
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
    },
    {
        name: 'openPosition',
        description: 'Open a new perpetuals position with specified parameters. Requires collateral approval if not using native token.',
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
                description: 'Account address initiating the position',
            },
            {
                name: 'tokenSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token for the position market',
            },
            {
                name: 'collateralTokenSymbol',
                type: 'string',
                enum: allTokens,
                description: 'Symbol of the token to use as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to open a long position (true) or short position (false)',
            },
            {
                name: 'sizeUsd',
                type: 'string',
                description: 'Size of the position in USD (minimum $11)',
            },
            {
                name: 'collateralUsd',
                type: 'string',
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
        required: ['chainName', 'account', 'tokenSymbol', 'collateralTokenSymbol', 'isLong', 'sizeUsd', 'collateralUsd', 'slippageBps'],
    },
    {
        name: 'getAllOpenPositions',
        description: 'Gets all open perpetual trading positions (long and short) for an account',
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
        ],
        required: ['chainName', 'account'],
    },
];
