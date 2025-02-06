import { Address, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlPoolOrderBy, GqlPoolOrderDirection, GqlSorSwapType } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool, poolContainsToken } from '../helpers/pools';
import { validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { formatSwapQuote } from '../helpers/swaps';
import { anonChainNameToGqlChain } from '../helpers/chains';

const MIN_TVL = 200_000;

interface Props {
    chainName: string;
    tokenIn: Address;
    tokenOut: Address;
    swapAmount: string;
}

export async function getQuoteForSwapExactIn({ chainName, tokenIn, tokenOut, swapAmount }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(swapAmount)) return toResult(`Invalid swap amount: ${swapAmount}`, true);

    const client = new BeetsClient();
    const swaps = await client.getSorSwap(tokenIn, tokenOut, GqlSorSwapType.ExactIn, swapAmount, anonChainNameToGqlChain(chainName));

    if (!swaps?.routes || !swaps.returnAmount) return toResult(`No swap routes found for the requested swap`, true);

    return toResult(formatSwapQuote(swaps));
} 