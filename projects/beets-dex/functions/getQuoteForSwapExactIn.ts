import { Address, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { MAX_FETCH_POOLS, supportedChains } from '../constants';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain, GqlPoolOrderBy, GqlPoolOrderDirection, GqlSorSwapType } from '../helpers/beets/types';
import { formatPoolMinimal } from '../helpers/pools';
import { simplifyPool, poolContainsToken } from '../helpers/pools';
import { validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { formatSwapQuote } from '../helpers/swaps';
import { anonChainNameToGqlChain } from '../helpers/chains';
import { getTokenByAddress } from '../helpers/tokens';

const MIN_TVL = 200_000;

interface Props {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    swapAmount: string;
}

export async function getQuoteForSwapExactIn({ chainName, tokenInAddress, tokenOutAddress, swapAmount }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(swapAmount)) return toResult(`Invalid swap amount: ${swapAmount}`, true);
    const tokenIn = await getTokenByAddress(chainName, tokenInAddress);
    if (!tokenIn) return toResult(`Token ${tokenInAddress} not found on ${chainName}`, true);
    const tokenOut = await getTokenByAddress(chainName, tokenOutAddress);
    if (!tokenOut) return toResult(`Token ${tokenOutAddress} not found on ${chainName}`, true);

    const client = new BeetsClient();
    const swaps = await client.getSorSwap(tokenInAddress, tokenOutAddress, GqlSorSwapType.ExactIn, swapAmount, anonChainNameToGqlChain(chainName) as GqlChain);

    if (!swaps?.routes || !swaps.returnAmount) return toResult(`No swap routes found for the requested swap`, true);

    return toResult(formatSwapQuote(swaps, tokenIn, tokenOut));
}
