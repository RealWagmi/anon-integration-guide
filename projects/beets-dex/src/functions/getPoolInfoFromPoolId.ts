import { Address } from 'viem';
import { EVM, FunctionReturn, toResult, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool } from '../helpers/pools';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { validatePoolId } from '../helpers/validation';

interface Props {
    chainName: string;
    account: Address | null;
    poolId: string;
}

/**
 * Gets detailed information about a specific pool by its ID.
 * Includes composition, TVL, APR and user position if account provided.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address|null} props.account - Optional address to check position for
 * @param {string} props.poolId - ID of the pool to query
 * @returns {Promise<FunctionReturn>} Detailed pool information
 */
export async function getPoolInfoFromPoolId({ chainName, account, poolId }: Props): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validatePoolId(poolId)) return toResult(`Invalid pool ID: ${poolId}`, true);

    const client = new BeetsClient();

    const pool = await client.getPool(poolId, anonChainNameToGqlChain(chainName) as GqlChain, account ?? '');
    if (!pool) return toResult(`Could not find pool with ID ${poolId}`, true);

    return toResult(formatPoolMinimal(simplifyPool(pool), ''));
}
