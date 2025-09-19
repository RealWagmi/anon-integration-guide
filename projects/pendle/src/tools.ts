import { AdapterExport, EVM } from '@heyanon/sdk';
import { MAX_LIQUIDITY_POOLS_IN_RESULTS, MAX_POSITIONS_IN_RESULTS, MIN_LIQUIDITY_FOR_MARKET, supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools = [
    {
        type: 'function',
        function: {
            name: 'getMyPositionsPortfolio',
            description: `Show the top ${MAX_POSITIONS_IN_RESULTS} positions in the user's portfolio, across all chains, together with the total portfolio value (TVL).  A position can be a principal token (PT), a yield token (YT) or a liquidity pool (LP).  For each position, show its token balance and dollar value.`,
            strict: true,
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getAddressPositionsPortfolio',
            description: `Show the top ${MAX_POSITIONS_IN_RESULTS} positions in the portfolio of the given wallet address, across all chains, together with the total portfolio value (TVL). A position can be a principal token (PT), a yield token (YT) or a liquidity pool (LP).  For each position, show its token balance and dollar value.`,
            strict: true,
            parameters: {
                type: 'object',
                properties: {
                    address: {
                        type: 'string',
                        description: 'Wallet address for which to show the portfolio',
                    },
                },
                required: ['address'],
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'getLiquidityPoolsWithHighestApy',
            description: `Show the top ${MAX_LIQUIDITY_POOLS_IN_RESULTS} liquidity pools with the highest yield, on the given chain. For each liquidity pool, show its name, TVL, and yield. For safety reasons only pools with a minimum liquidity of $${MIN_LIQUIDITY_FOR_MARKET} are shown.`,
            strict: true,
            parameters: {
                type: 'object',
                properties: {
                    chainName: {
                        type: 'string',
                        enum: supportedChains.map(getChainName),
                        description: 'Chain name',
                    },
                    filterTokenSymbol: {
                        type: ['string', 'null'],
                        description: 'Optionally, filter the pools by name (e.g. "ETH", "stETH", "USDC")',
                    },
                },
                required: ['chainName', 'filterTokenSymbol'],
                additionalProperties: false,
            },
        },
    },
] satisfies AdapterExport['tools'];
