import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds.sonic];

/**
 * The address used to identify the native token by Balancer,
 * valid for all chains.
 */
export const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/**
 * How much to approve for spending a token, as a multiple of the
 * amount needed to add liquidity.  Choose a value larger
 * than 1 to account for the fact that sometimes, by the time the
 * final swap or add liquidity transaction is sent, the needed amount
 * has changed.
 */
export const APPROVE_AMOUNT_IN_EXCESS = 1.3;

/**
 * Maximum number of pools to show in the search results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_POOLS_IN_RESULTS = 10;

/**
 * Maximum number of pools to fetch from the backend in
 * a single request.
 */
export const MAX_FETCH_POOLS = 100;

/**
 * Minimum TVL in dollars that pools must have to be included
 * in search results.
 */
export const MIN_TVL = 100_000;

/**
 * Token synonyms, used to accept multiple spellings or slight variants
 * of the "official" token symbol.
 *
 * Always use upper-case symbols as keys.
 */
export const TOKEN_SYNONYMS = {
    [ChainIds.sonic]: {
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
    [ChainIds.sonic]: {
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
 * expressed as a number of significant digits.
 */
export const DEFAULT_PRECISION = 6;

/**
 * Used to calculate the default deadline for swaps,
 */
export const DEFAULT_DEADLINE_FROM_NOW = 7200n;

/**
 * The default slippage percentage to use for swaps,
 * expressed as a number between 0 and 100.
 */
export const DEFAULT_SLIPPAGE_AS_PERCENTAGE = 1;
