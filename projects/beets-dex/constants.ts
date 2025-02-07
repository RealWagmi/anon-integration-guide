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
 *
 * Always use upper-case symbols as keys.
 */
export const TOKEN_SYNONYMS = {
    [ChainId.SONIC]: {
        SONIC: 'S',
        WSONIC: 'wS',
        USDC: 'USDC.e',
        ETH: 'WETH',
        ETHER: 'WETH',
    },
};

/**
 * Whether to allow the LLM to replace token tickers with
 * their synonyms, e.g. "ETH" -> "WETH" or "USDC" -> "USDC.e".
 */
export const ALLOW_TOKEN_SYNONYMS = true;

/**
 * The default precision used to show token amounts,
 * expressed as a number of decimal places.
 */
export const DEFAULT_PRECISION = 6;

/**
 * Used to calculate the default deadline for swaps,
 */
export const DEFAULT_DEADLINE_FROM_NOW = 7200n;

/**
 * The default slippage percentage to use for swaps,
 * expressed as a number between 0 and 1.
 */
export const DEFAULT_SLIPPAGE_AS_PERCENTAGE = 1;
