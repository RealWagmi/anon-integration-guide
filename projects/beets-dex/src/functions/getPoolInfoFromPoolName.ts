import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { formatPoolMinimal, simplifyPool } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';

interface Props {
    chainName: string;
    poolName: string;
}

export async function getPoolInfoFromPoolName({ chainName, poolName }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const client = new BeetsClient();

    // Get pools matching the name
    const pools = await client.getPools(
        GqlPoolOrderBy.TotalLiquidity,
        GqlPoolOrderDirection.Desc,
        MAX_FETCH_POOLS,
        { chainIn: [anonChainNameToGqlChain(chainName) as GqlChain] },
        poolName,
    );

    if (!pools || pools.length === 0) {
        return toResult(`No pools found matching name "${poolName}"`);
    }

    // If multiple pools match, return list of matches
    if (pools.length > 1) {
        const matchingPools = pools.map((pool, index) => formatPoolMinimal(simplifyPool(pool), `${index + 1}. `)).join('\n');
        return toResult(`Multiple pools found matching "${poolName}". Please specify the name of the pool and enclose it in quotes:\n\n${matchingPools}`, true);
    }

    // Return detailed info for the single matching pool
    const pool = pools[0];
    return toResult(formatPoolMinimal(simplifyPool(pool)));
}
