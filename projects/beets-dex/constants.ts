import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.SONIC];

/**
 * Maximum number of pools to fetch from the backend in
 * a single request.
 */
export const MAX_FETCH_POOLS = 100;

/**
 * Token synonyms, used to accept multiple spellings or slight variants
 * of the "official" token symbol.
 */
export const TOKEN_SYNONYMS = {
    [ChainId.SONIC]: {
        'SONIC': 'S',
        'WSONIC': 'wS',
        'USDC': 'USDC.e',
        'ETHER': 'ETH'
    },
};
