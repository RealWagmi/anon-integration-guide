import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds.sonic, ChainIds.base, ChainIds.arbitrum, ChainIds.ethereum];

/**
 * Mapping from HeyAnon chain names to Beefy chain names
 * Make sure to have an entry for each chain in supportedChains
 */
export const ANON_TO_BEEFY_CHAIN_NAMES = {
    ethereum: 'ethereum',
    optimism: 'optimism',
    bsc: 'bsc',
    gnosis: 'gnosis',
    polygon: 'polygon',
    sonic: 'sonic',
    zksync: 'zksync',
    metis: 'metis',
    kava_evm: 'kava',
    base: 'base',
    avalanche: 'avax',
    arbitrum: 'arbitrum',
    scroll: 'scroll',
};

/**
 * Mapping from Beefy chain names to HeyAnon chain names
 */
export const BEEFY_TO_ANON_CHAIN_NAMES = Object.fromEntries(Object.entries(ANON_TO_BEEFY_CHAIN_NAMES).map(([key, value]) => [value, key]));

/**
 * Decimals of mooTokens.
 */
export const MOO_TOKEN_DECIMALS = 18;

/**
 * How much to approve for spending a token, as a multiple of the
 * amount needed to add liquidity.  Choose a value larger
 * than 1 to account for the fact that sometimes, by the time the
 * final swap or add liquidity transaction is sent, the needed amount
 * has changed.
 */
export const APPROVE_AMOUNT_IN_EXCESS = 1.3;

/**
 * Maximum number of vaults to show in the search results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_VAULTS_IN_RESULTS = 10;

/**
 * Maximum number of vaults to fetch from the backend in
 * a single request.
 */
export const MAX_FETCH_VAULTS = 100;

/**
 * Will prevent to add liquidity to vaults with less than
 * this amount of liquidity.
 */
export const MIN_LIQUIDITY_FOR_ADD_LIQUIDITY = 1_000;

/**
 * Minimum TVL in dollars that vaults must have to be included
 * in search results.
 */
export const MIN_TVL_FOR_SEARCH_RESULTS = 100_000;

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
 * opportunities on ETH", search results will include all vaults
 * containing wETH, stETH and other staking products.
 *
 * The opposite does not hold true: if the user asks for "yield
 * opportunities on stETH", only vaults containing stETH will be
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
