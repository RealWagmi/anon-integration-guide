import { Address } from 'viem';
import { EVM, FunctionReturn, toResult, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, MAX_POOLS_IN_RESULTS, MIN_TVL, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { formatPoolMinimal, simplifyPool } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { getBalancerTokenByAddress, to$$$ } from '../helpers/tokens';
import { filterPoolsByTokens } from '../helpers/pools';

interface Props {
    chainName: string;
    tokenAddress: Address;
}

/**
 * Finds all pools that contain a specific token, sorted by TVL.
 * Only includes pools above minimum TVL threshold.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.tokenAddress - Address of token to search for
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} List of pools sorted by TVL with pool details
 */
export async function getPoolsWithToken({ chainName, tokenAddress }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const token = await getBalancerTokenByAddress(chainName, tokenAddress);
    if (!token) return toResult(`Could not find token information`, true);

    const client = new BeetsClient();

    // Get pools sorted by TVL
    const pools = await client.getPools(GqlPoolOrderBy.TotalLiquidity, GqlPoolOrderDirection.Desc, MAX_FETCH_POOLS, {
        chainIn: [anonChainNameToGqlChain(chainName) as GqlChain],
        minTvl: MIN_TVL,
    });

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of ${to$$$(MIN_TVL, 0, 0)}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Filter pools containing the token (including equivalent tokens)
    const matchingPools = await filterPoolsByTokens(chainName, pools, [token], true);

    if (matchingPools.length === 0) {
        return toResult(`No pools found containing token ${tokenAddress} with minimum TVL of ${to$$$(MIN_TVL, 0, 0)}`);
    }

    return toResult(
        matchingPools
            .slice(0, MAX_POOLS_IN_RESULTS)
            .map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `))
            .join('\n'),
    );
}
