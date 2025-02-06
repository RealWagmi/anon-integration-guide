import { Address } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool, poolContainsToken } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';

const MIN_TVL = 200_000;

interface Props {
    chainName: string;
    tokenAddress: Address;
}

export async function getBestAprForToken({ chainName, tokenAddress }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const client = new BeetsClient();

    // Get pools sorted by APR
    const pools = await client.getPools(
        GqlPoolOrderBy.Apr,
        GqlPoolOrderDirection.Desc,
        MAX_FETCH_POOLS,
        {
            chainIn: [anonChainNameToGqlChain(chainName)],
            minTvl: MIN_TVL
        }
    );

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of $${MIN_TVL}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Filter pools containing the token (including nested and underlying)
    const matchingPools = pools
        .filter(pool => poolContainsToken(pool, tokenAddress))
        .slice(0, 10);

    if (matchingPools.length === 0) {
        return toResult(`No pools found containing token ${tokenAddress} with minimum TVL of $${MIN_TVL}`);
    }

    return toResult(matchingPools.map((pool, index) => 
        formatPoolMinimal(simplifyPool(pool), `${index + 1}. `)
    ).join('\n'));
} 