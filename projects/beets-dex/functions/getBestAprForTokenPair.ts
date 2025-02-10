import { Address } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, MIN_TVL, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool, poolContainsToken } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { getBalancerTokenByAddress } from '../helpers/tokens';
import { Token } from '@balancer/sdk';

interface Props {
    chainName: string;
    token0Address: Address;
    token1Address: Address;
}

export async function getBestAprForTokenPair({ chainName, token0Address, token1Address }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (token0Address === token1Address) return toResult(`Tokens must be different`, true);

    const client = new BeetsClient();

    // Get pools sorted by APR
    const pools = await client.getPools(GqlPoolOrderBy.Apr, GqlPoolOrderDirection.Desc, MAX_FETCH_POOLS, {
        chainIn: [anonChainNameToGqlChain(chainName) as GqlChain],
        minTvl: MIN_TVL,
    });

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of $${MIN_TVL}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Filter pools containing both tokens (including nested and underlying)
    const matchingPools = pools.filter((pool) => poolContainsToken(pool, token0Address) && poolContainsToken(pool, token1Address)).slice(0, MAX_FETCH_POOLS);

    if (matchingPools.length === 0) {
        return toResult(`No pools found containing both tokens with minimum TVL of $${MIN_TVL}`);
    }

    return toResult(matchingPools.map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `)).join('\n'));
}
