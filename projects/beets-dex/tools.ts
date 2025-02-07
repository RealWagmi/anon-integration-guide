import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'executeSwapExactIn',
        description:
            'Execute a swap where you specify the EXACT AMOUNT YOU WANT TO SEND in order to buy a token. For example: "Swap 1 ETH for USDC", "Sell 1 ETH for USDC", "Buy USDC with 1 ETH".',
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
                description: 'Address of the token you want to swap in',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive',
            },
            {
                name: 'humanReadableAmountIn',
                type: 'string',
                description: 'The exact amount of tokens you want to swap in, expressed as decimals (e.g. 1 ETH rather than 10^18)',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description: 'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%)',
            },
        ],
    },
    {
        name: 'executeSwapExactOut',
        description:
            'Execute a swap where you specify the EXACT AMOUNT YOU WANT TO RECEIVE of the token you want to buy. For example: "Swap ETH for 1000 USDC", "Sell ETH for 1000 USDC", "Buy 1000 USDC with ETH"',
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
                description: 'Address of the token you want to swap in',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive',
            },
            {
                name: 'humanReadableAmountOut',
                type: 'string',
                description: 'The exact amount of tokens you want to receive, expressed as decimals (e.g. 1000 USDC rather than 10^9)',
            },
            {
                name: 'slippageAsPercentage',
                type: ['string', 'null'],
                description: 'The maximum slippage you are willing to tolerate, expressed as a percentage (e.g. 10 for 10%)',
            },
        ],
    },
    {
        name: 'getQuoteForSwapExactIn',
        description:
            'Given a FIXED AMOUNT TO SEND ORDER TO BUY A TOKEN, calculate how many tokens will be received in return.  For example: "How much USDC will I get for 1 ETH?", "USDC if I sell 1 ETH?", "USDC I can get for 1 ETH?"',
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
                description: 'Address of the token you want to swap in',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive from the swap',
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
            'Given a FIXED AMOUNT TO RECEIVE, calculate how many tokens need to be sent.  For example: "How much ETH do I need to buy 1000 USDC?", "USDC needed to buy 1 ETH?", "How much USDC to reeive exactly 1 ETH?"',
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
                description: 'Address of the token you want to swap in',
            },
            {
                name: 'tokenOutAddress',
                type: 'string',
                description: 'Address of the token you want to receive from the swap',
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
        description: 'Show the top pools containing a specific token, sorted by APR. Only includes pools with TVL > $200,000.',
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
                description: 'Address of the token to search for',
            },
        ],
    },
    {
        name: 'getTokenAddressFromSymbol',
        description: 'Get the address of a token from its symbol on a specific chain',
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
