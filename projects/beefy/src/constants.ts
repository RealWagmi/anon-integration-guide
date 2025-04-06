import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds.sonic, ChainIds.base, ChainIds.arbitrum, ChainIds.ethereum];

/**
 * Mapping from HeyAnon chain names to Beefy chain names;
 * all keys and values must be lowercase.
 * Make sure to have an entry for each chain in supportedChains
 */
export const ANON_TO_BEEFY_CHAIN_NAMES: Record<string, string> = {
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
 * The default precision used to show token amounts,
 * expressed as a number of significant digits.
 */
export const DEFAULT_PRECISION = 6;

/**
 * Useful for operations between floating point numbers and bigints.
 */
export const WAD = 1000000000000000000n;
