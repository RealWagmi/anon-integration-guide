import { Address } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlPoolOrderBy, GqlPoolOrderDirection } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';

interface Props {
    chainName: string;
    account: Address;
}

export async function getMyPositionsPortfolio({ chainName, account }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const client = new BeetsClient();
    const positions = await client.getPools(
        GqlPoolOrderBy.UserbalanceUsd,
        GqlPoolOrderDirection.Desc,
        MAX_FETCH_POOLS,
        {
            userAddress: account,
            chainIn: [anonChainNameToGqlChain(chainName)]
        }
    );

    if (!positions || positions.length === 0) {
        return toResult("No positions found in your portfolio");
    }

    return toResult(positions.map((position, index) => 
        formatPoolMinimal(simplifyPool(position), `${index + 1}. `)
    ).join('\n'));
}