import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { MAX_FETCH_POOLS, MIN_TVL, supportedChains } from '../constants';
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

export async function getPoolsWithTokenPair({ chainName, token0Address, token1Address }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
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

    // Get pools sorted by TVL
    const pools = await client.getPools(GqlPoolOrderBy.TotalLiquidity, GqlPoolOrderDirection.Desc, MAX_FETCH_POOLS, {
        chainIn: [anonChainNameToGqlChain(chainName) as GqlChain],
        minTvl: MIN_TVL,
    });

    if (!pools || pools.length === 0) {
        return toResult(`No pools found with minimum TVL of ${to$$$(MIN_TVL, 0, 0)}`);
    }

    notify(`Found ${pools.length} pools, filtering...`);

    // Filter pools containing both tokens or their equivalents
    const matchingPools = await filterPoolsByTokens(chainName, pools, [token0, token1], true);

    if (matchingPools.length === 0) {
        return toResult(`No pools found containing both ${token0.symbol} and ${token1.symbol} with minimum TVL of ${to$$$(MIN_TVL, 0, 0)}`);
    }

    return toResult(matchingPools.map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `)).join('\n'));
}
