import { AiTool } from '@heyanon/sdk';
import { MAX_MARKETS_IN_RESULTS } from './constants';
import { SUPPORTED_MARKET_TYPES } from './helpers/exchange';

const MARKET_TYPE_PARAMETER = {
    name: 'marketType',
    type: 'string',
    description: `Market type`,
    enum: SUPPORTED_MARKET_TYPES,
};

const MARKET_DESCRIPTION = [
    'Symbol of the market.  The type of the market can be inferred from the symbol:',
    '- Spot market symbols have the form "BTC/USDT", where the FIRST currency is the base currency and the SECOND currency is the quote currency.',
    '- Future market symbols have the form "BTC/USDT:USDT", where the THIRD currency is the settlement currency.',
    '- Delivery market symbols have the form "BTC/USD:BTC-250926", where the LAST part of the symbol is the expiry date of the contract.',
].join(' ');

export const tools: AiTool[] = [
    {
        name: 'getBalance',
        description: 'Get the unified user balance.  This does not include open positions.  For each currency, show how much is available to trade (free).',
        required: ['currency'],
        props: [{ name: 'currency', type: ['string', 'null'], description: 'Optionally, specify a currency to show balance just for that currency, e.g. "BTC"' }],
    },
    {
        name: 'getCurrencyMarketsOfGivenType',
        description: `Show active markets (also called trading pairs) with the given currency or token.  Show only the first ${MAX_MARKETS_IN_RESULTS} markets.  If the user asks for future markets, the function should be called for both perpetual and delivery markets.`,
        required: ['marketType', 'currency'],
        props: [
            MARKET_TYPE_PARAMETER,
            {
                name: 'currency',
                type: 'string',
                description: 'Currency to get markets for, e.g. "BTC"',
            },
        ],
    },
    {
        name: 'getMarketInfo',
        description:
            'Get price, volume and leverage information about a specific market (also called a trading pair).  Prices are in quote currency.  Always use this function to get up-to-date prices.',
        required: ['market'],
        props: [
            {
                name: 'market',
                type: 'string',
                description: MARKET_DESCRIPTION,
            },
        ],
    },
];
