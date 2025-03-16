import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { MAX_FETCH_POOLS, MAX_POOLS_IN_RESULTS, MIN_TVL_FOR_SEARCH_RESULTS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { formatPoolMinimal, simplifyPool } from '../helpers/pools';
import { getBalancerTokenByAddress, to$$$ } from '../helpers/tokens';
import { filterPoolsByTokens } from '../helpers/pools';

interface Props {
    chainName: string;
    token0Address: Address;
    token1Address: Address;
}

/**
 * Finds pools with the highest APR that contain a specific pair of tokens.
 * Only includes pools above minimum TVL threshold.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.token0Address - Address of first token
 * @param {Address} props.token1Address - Address of second token
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} List of pools sorted by APR with pool details
 */
export async function getBestAprForTokenPair({ chainName, token0Address, token1Address }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (token0Address === token1Address) return toResult(`Tokens must be different`, true);

    // Get token information
    const token0 = await getBalancerTokenByAddress(chainName, token0Address);
    const token1 = await getBalancerTokenByAddress(chainName, token1Address);
    if (!token0 || !token1) {
        return toResult(`Could not find token information`, true);
    }

    const client = new BeetsClient();

    // Get pools sorted by APR
    const pools = await client.getPools(GqlPoolOrderBy.Apr, GqlPoolOrderDirection.Desc, MAX_FETCH_POOLS, {
        chainIn: [anonChainNameToGqlChain(chainName) as GqlChain],
        minTvl: MIN_TVL_FOR_SEARCH_RESULTS,
    });

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of ${to$$$(MIN_TVL_FOR_SEARCH_RESULTS, 0, 0)}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Filter pools containing both tokens or their equivalents
    const matchingPools = await filterPoolsByTokens(chainName, pools, [token0, token1], true);
    if (matchingPools.length === 0) {
        return toResult(`No pools found containing both ${token0.symbol} and ${token1.symbol} with minimum TVL of ${to$$$(MIN_TVL_FOR_SEARCH_RESULTS, 0, 0)}`);
    }

    return toResult(
        matchingPools
            .slice(0, MAX_POOLS_IN_RESULTS)
            .map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `))
            .join('\n'),
    );
}
