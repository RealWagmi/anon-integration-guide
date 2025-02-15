import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Tokens do not need to be proportional as the protocol will automatically zap them for the correct proportions',
        required: ['chainName', 'account', 'poolId', 'token0Address', 'token0Amount', 'token1Address', 'token1Amount', 'slippageAsPercentage'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address adding the liquidity',
            },
            {
                name: 'poolId',
                type: 'string',
                description: 'ID of the pool to add liquidity to, starting with "0x"',
            },
            {
                name: 'token0Address',
                type: 'string',
                description: 'Address of the first token to add, starting with "0x"',
            },
            {
                name: 'token0Amount',
                type: 'string',
                description: 'Amount of the first token to add, in decimal form (e.g. "1.5 ETH" instead of 1.5e18)',
            },
            {
                name: 'token1Address',
                type: ['string', 'null'],
                description: 'Optional: Address of the second token to add, starting with "0x". If not provided, the first token will be zapped alone in the pool.',
            },
            {
                name: 'token1Amount',
                type: ['string', 'null'],
                description: 'Optional: Amount of the second token to add, in decimal form (e.g. "5,000 USDC" instead of 5000e6)',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description:
                    'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%). If null, the default slippage for the chain will be used.',
            },
        ],
    },
    {
        name: 'removeLiquidity',
        description:
            'Remove liquidity from a pool and return the tokens to the user.  The amount of liquidity to be removed is specified as a percentage of the user liquidity (default is 100%).  The liquidity will be removed in the same proportions as the pool tokens.',
        required: ['chainName', 'account', 'poolId', 'removalPercentage', 'slippageAsPercentage'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address removing the liquidity',
            },
            {
                name: 'poolId',
                type: 'string',
                description: 'ID of the pool to remove liquidity from, starting with "0x"',
            },
            {
                name: 'removalPercentage',
                type: ['string', 'null'],
                description: 'Amount of liquidity to remove, expressed as a percentage (e.g. 50 for 50%). If null, all of the user liquidity will be removed.',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description:
                    'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%). If null, the default slippage for the chain will be used.',
            },
        ],
    },
    {
        name: 'executeSwapExactIn',
        description:
            'Get a quote for and then execute a swap where you specify the EXACT AMOUNT YOU WANT TO SEND in order to buy a token. For example: "Swap 1 X for Y", "Sell 1 X for Y", "Buy Y with 1 X".',
        required: ['chainName', 'account', 'tokenInAddress', 'tokenOutAddress', 'humanReadableAmountIn', 'slippageAsPercentage'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address performing the swap',
            },

            {
                name: 'tokenInAddress',
                type: 'string',
                description: 'Address of the token you want to swap in, starting with "0x"',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive, starting with "0x"',
            },
            {
                name: 'humanReadableAmountIn',
                type: 'string',
                description: 'The exact amount of tokens you want to swap in, expressed as decimals (e.g. 1 ETH rather than 10^18)',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description:
                    'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%). If null, the default slippage for the chain will be used.',
            },
        ],
    },
    {
        name: 'executeSwapExactOut',
        description:
            'Get a quote for and then execute a swap where you specify the EXACT AMOUNT YOU WANT TO RECEIVE of the token you want to buy. For example: "Swap X for 1000 Y", "Sell X for 1000 Y", "Buy 1000 Y with X".',
        required: ['chainName', 'account', 'tokenInAddress', 'tokenOutAddress', 'humanReadableAmountOut', 'slippageAsPercentage'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address performing the swap',
            },
            {
                name: 'tokenInAddress',
                type: 'string',
                description: 'Address of the token you want to swap in, starting with "0x"',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive, starting with "0x"',
            },
            {
                name: 'humanReadableAmountOut',
                type: 'string',
                description: 'The exact amount of tokens you want to receive, expressed as decimals (e.g. 1000 USDC rather than 10^9)',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description:
                    'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%). If null, the default slippage for the chain will be used.',
            },
        ],
    },
    {
        name: 'getQuoteForSwapExactIn',
        description:
            'Given a FIXED AMOUNT TO SEND ORDER TO BUY A TOKEN, calculate how many tokens will be received in return.  For example: "How much Y will I get for 1 X?", "Y I can get for 1 X?".',
        required: ['chainName', 'tokenInAddress', 'tokenOutAddress', 'humanReadableAmountIn'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenInAddress',
                type: 'string',
                description: 'Address of the token you want to swap in, starting with "0x"',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive from the swap, starting with "0x"',
            },
            {
                name: 'humanReadableAmountIn',
                type: 'string',
                description: 'The exact amount of tokens you want to swap in, expressed as decimals (e.g. 1 ETH rather than 10^18)',
            },
        ],
    },
    {
        name: 'getQuoteForSwapExactOut',
        description:
            'Given a FIXED AMOUNT TO RECEIVE, calculate how many tokens need to be sent.  For example: "How much X do I need to buy 1000 Y?", "How much X to receive exactly 1 Y?".',
        required: ['chainName', 'tokenInAddress', 'tokenOutAddress', 'humanReadableAmountOut'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenInAddress',
                type: 'string',
                description: 'Address of the token you want to swap in, starting with "0x"',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive from the swap, starting with "0x"',
            },
            {
                name: 'humanReadableAmountOut',
                type: 'string',
                description: 'The exact amount of tokens you want to receive, expressed as decimals (e.g. 1000 USDC rather than 10^9)',
            },
        ],
    },
    {
        name: 'getMyPositionsPortfolio',
        description:
            'Show the liquidity positions in the user portfolio.  For each position, show the tokens in the pool, the type of pool, the amounts of tokens, the APR yield, and the dollar value of the position.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address of the user',
            },
        ],
    },
    {
        name: 'getBestAprForToken',
        description:
            'Show pools with the best APR yield for the given token, sorted by APR. Only includes pools with TVL > $100,000.  Will include also pools with tokens equivalent to the given token, e.g. if you ask for Sonic, pools with stS (staked Sonic) will be included too.',
        required: ['chainName', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the token to search for, starting with "0x"',
            },
        ],
    },
    {
        name: 'getBestAprForTokenPair',
        description:
            'Show pools with the best APR yield for the given pair of tokens, sorted by APR.  Only includes pools with TVL > $100,000.  Will include also pools with tokens equivalent to the given ones, e.g. if you ask for Sonic, pools with stS (staked Sonic) will be included too.',
        required: ['chainName', 'token0Address', 'token1Address'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token0Address',
                type: 'string',
                description: 'Address of the first token to search for, starting with "0x"',
            },
            {
                name: 'token1Address',
                type: 'string',
                description: 'Address of the second token to search for, starting with "0x"',
            },
        ],
    },
    {
        name: 'getPoolsWithToken',
        description: 'Show pools with the given token, sorted by TVL. Only includes pools with TVL > $100,000.',
        required: ['chainName', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the token to search for, starting with "0x"',
            },
        ],
    },
    {
        name: 'getPoolsWithTokenPair',
        description: 'Show pools with the given pair of tokens, sorted by TVL.  Only includes pools with TVL > $100,000.',
        required: ['chainName', 'token0Address', 'token1Address'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'token0Address',
                type: 'string',
                description: 'Address of the first token to search for, starting with "0x"',
            },
            {
                name: 'token1Address',
                type: 'string',
                description: 'Address of the second token to search for, starting with "0x"',
            },
        ],
    },
    {
        name: 'getPoolInfoFromPoolId',
        description: 'Get information about a specific pool, including the APR yield, the TVL, and any positions in the pool belonging to the user.',
        required: ['chainName', 'account', 'poolId'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: ['string', 'null'],
                description: 'Address of the user (optional).  If provided, the pool info will include info on any user positions in the pool.',
            },
            {
                name: 'poolId',
                type: 'string',
                description: 'ID of the pool to get information about, starting with "0x"',
            },
        ],
    },
    {
        name: 'getPoolInfoFromPoolName',
        description: 'Get information about a specific pool by its name, including the APR yield and the TVL.',
        required: ['chainName', 'poolName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'poolName',
                type: 'string',
                description: 'Name of the pool to search for, for example "Staked Sonic Symphony".  The search is case-insensitive, with partial matches allowed.',
            },
        ],
    },
    {
        name: 'getTokenAddressFromSymbol',
        description: 'Get the address of a token from its symbol.',
        required: ['chainName', 'symbol'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name',
            },
            {
                name: 'symbol',
                type: 'string',
                description: 'Token symbol (e.g. "wS", "stS", "USDC.e")',
            },
        ],
    },
];
