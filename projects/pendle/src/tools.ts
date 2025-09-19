import { AdapterExport } from '@heyanon/sdk';
import { MAX_POSITIONS_IN_RESULTS } from './constants';

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
] satisfies AdapterExport['tools'];
