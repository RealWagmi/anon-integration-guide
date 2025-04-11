import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

/**
 * Chains supported by the Beefy integration with HeyAnon.
 *
 * This is a cross-section of the chains supported by Beefy Finance
 * and HeyAnon.
 *
 * Make sure to also have an entry in ANON_TO_BEEFY_CHAIN_NAMES for
 * each chain in this list.
 */
export const supportedChains = [
    ChainIds.arbitrum,
    ChainIds.avalanche,
    ChainIds.base,
    ChainIds.bsc,
    ChainIds.ethereum,
    ChainIds.gnosis,
    ChainIds.kava_evm,
    ChainIds.metis,
    ChainIds.optimism,
    ChainIds.polygon,
    ChainIds.scroll,
    ChainIds.sonic,
    ChainIds.zksync,
];

/**
 * Mapping from HeyAnon chain names to Beefy chain names;
 * all keys and values must be lowercase.
 */
export const ANON_TO_BEEFY_CHAIN_NAMES: Record<string, string> = {
    arbitrum: 'arbitrum',
    avalanche: 'avax',
    base: 'base',
    bsc: 'bsc',
    ethereum: 'ethereum',
    gnosis: 'gnosis',
    kava_evm: 'kava',
    metis: 'metis',
    optimism: 'optimism',
    polygon: 'polygon',
    scroll: 'scroll',
    sonic: 'sonic',
    zksync: 'zksync',
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

/**
 * Big number representing 10^18.
 */
export const E18 = 1000000000000000000n;
