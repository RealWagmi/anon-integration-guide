import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.SONIC];

/**
 * The address used to identify the native token by Balancer,
 * valid for all chains.
 */
export const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/**
 * Maximum number of pools to fetch from the backend in
 * a single request.
 */
export const MAX_FETCH_POOLS = 100;

/**
 * Minimum TVL in dollars that pools must have to be included
 * in search results.
 */
export const MIN_TVL = 200_000;

/**
 * Token synonyms, used to accept multiple spellings or slight variants
 * of the "official" token symbol.
 *
 * Always use upper-case symbols as keys.
 */
export const TOKEN_SYNONYMS = {
    [ChainId.SONIC]: {
        SONIC: 'S',
        USDC: 'USDC.e',
        ETH: 'WETH',
        ETHER: 'WETH',
    },
};

/**
 * Tokens that are equivalent or neary equivalent for the purpose
 * of APR yields.  For example, if the user asks for "yield
 * opportunities on ETH", search results will include all pools
 * containing wETH, stETH and other staking products.
 *
 * The opposite does not hold true: if the user asks for "yield
 * opportunities on stETH", only pools containing stETH will be
 * considered, not wETH.
 *
 * Always use upper-case symbols as keys.
 */
export const EQUIVALENT_TOKENS = {
    [ChainId.SONIC]: {
        ETH: ['WETH', 'STETH'],
        WETH: ['STETH'],
        S: ['WS', 'STS'],
        WS: ['STS'],
        'USDC.e': ['SCUSD'],
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
export const DEFAULT_PRECISION = 4;

/**
 * Used to calculate the default deadline for swaps,
 */
export const DEFAULT_DEADLINE_FROM_NOW = 7200n;

/**
 * The default slippage percentage to use for swaps,
 * expressed as a number between 0 and 1.
 */
export const DEFAULT_SLIPPAGE_AS_PERCENTAGE = 1;
