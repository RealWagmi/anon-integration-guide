import { Address } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { anonChainNameToBalancerChainId, getDefaultRpcUrl } from '../helpers/chains';
import { BalancerApi, ExactInQueryOutput, Swap, SwapKind, TokenAmount } from '@balancer/sdk';
import { getBalancerTokenByAddress } from '../helpers/tokens';
import { formatSwapQuote } from '../helpers/swaps';

interface Props {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmountOut: string;
}

export async function getQuoteForSwapExactOut(
    { chainName, tokenInAddress, tokenOutAddress, humanReadableAmountOut }: Props,
    { notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validation
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmountOut)) return toResult(`Invalid swap amount: ${humanReadableAmountOut}`, true);

    // Get tokens
    const balancerTokenIn = await getBalancerTokenByAddress(chainName, tokenInAddress);
    if (!balancerTokenIn) return toResult(`Input token ${tokenInAddress} not found on ${chainName}`, true);
    const balancerTokenOut = await getBalancerTokenByAddress(chainName, tokenOutAddress);
    if (!balancerTokenOut) return toResult(`Output token ${tokenOutAddress} not found on ${chainName}`, true);
    notify(`Getting quote for swap ${balancerTokenIn.symbol} -> ${humanReadableAmountOut} ${balancerTokenOut.symbol} on ${chainName}`);

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get balancer swap amount
    const balancerSwapAmount = TokenAmount.fromHumanAmount(balancerTokenIn, humanReadableAmountOut as `${number}`);

    // Get SOR paths
    const balancerClient = new BalancerApi('https://backend-v3.beets-ftm-node.com/', balancerChainId);
    const sorPaths = await balancerClient.sorSwapPaths.fetchSorSwapPaths({
        chainId: balancerChainId,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        swapKind: SwapKind.GivenOut,
        swapAmount: balancerSwapAmount,
    });
    notify(`Found ${sorPaths.length} paths for the swap`);

    const swap = new Swap({
        chainId: balancerChainId,
        paths: sorPaths,
        swapKind: SwapKind.GivenOut,
    });

    // Get RPC URL
    const publicClient = getProvider(chainId);
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) return toResult(`Chain ${chainName} not supported by viem`, true);

    // Get up to date swap result by querying onchain
    const updated = (await swap.query(rpcUrl)) as ExactInQueryOutput;

    return toResult(formatSwapQuote(updated, balancerTokenIn, balancerTokenOut));
}
