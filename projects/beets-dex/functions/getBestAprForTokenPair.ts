import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { EQUIVALENT_TOKENS, MAX_FETCH_POOLS, MIN_TVL, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { formatPoolMinimal, poolContainsToken, simplifyPool } from '../helpers/pools';
import { getBalancerTokenByAddress, getEquivalentTokenAddresses } from '../helpers/tokens';

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
        minTvl: MIN_TVL,
    });

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of $${MIN_TVL}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Get equivalent token addresses
    const equivalentTokenAddresses0 = await getEquivalentTokenAddresses(chainName, token0);
    const equivalentTokenAddresses1 = await getEquivalentTokenAddresses(chainName, token1);

    // Filter pools containing either the original tokens or their equivalents
    const matchingPools = pools
        .filter((pool) => {
            const hasToken0 = poolContainsToken(pool, token0Address) || equivalentTokenAddresses0.some((addr) => poolContainsToken(pool, addr));
            const hasToken1 = poolContainsToken(pool, token1Address) || equivalentTokenAddresses1.some((addr) => poolContainsToken(pool, addr));
            return hasToken0 && hasToken1;
        })
        .slice(0, MAX_FETCH_POOLS);

    if (matchingPools.length === 0) {
        return toResult(`No pools found containing both ${token0.symbol} and ${token1.symbol} with minimum TVL of $${MIN_TVL}`);
    }

    return toResult(matchingPools.map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `)).join('\n'));
}
