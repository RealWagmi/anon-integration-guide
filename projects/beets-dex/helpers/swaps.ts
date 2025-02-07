import { DECIMAL_SCALES, ExactInQueryOutput, ExactOutQueryOutput, SwapKind, Token } from '@balancer/sdk';
import util from 'util';
import { Address } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { anonChainNameToBalancerChainId, getDefaultRpcUrl } from '../helpers/chains';
import { BalancerApi, Swap, TokenAmount } from '@balancer/sdk';
import { getBalancerTokenByAddress } from '../helpers/tokens';
/**
 * Given a quote for a swap returned by the Balancer SDK, format it into a
 * human-readable multi-line string, including information about the price, the
 * amount of tokens that will be swapped, those that will be received, the price
 * impact, and the route taken.
 *
 * TODO: the output should contain a warning in the case that the price
 * impact is greater than 0.5%.
 */
export function formatSwapQuote(quote: ExactInQueryOutput | ExactOutQueryOutput, tokenIn: Token, tokenOut: Token, significatDigits = 6): string {
    const parts = [];

    // Add basic swap information
    if (quote.swapKind === SwapKind.GivenIn) {
        parts.push(`Swap ${quote.amountIn.toSignificant(significatDigits)} ${tokenIn.symbol}`);
        parts.push(`For ${quote.expectedAmountOut.toSignificant(significatDigits)} ${tokenOut.symbol}`);
    } else {
        parts.push(`Swap ${quote.expectedAmountIn.toSignificant(significatDigits)} ${tokenIn.symbol}`);
        parts.push(`For ${quote.amountOut.toSignificant(significatDigits)} ${tokenOut.symbol}`);
    }

    // Add price information
    let price = 0;
    const PRECISION_FACTOR = DECIMAL_SCALES[significatDigits as keyof typeof DECIMAL_SCALES];
    if (quote.swapKind === SwapKind.GivenIn) {
        // Use BigInt division with scaling factor for precision
        price = Number((quote.amountIn.scale18 * PRECISION_FACTOR) / quote.expectedAmountOut.scale18) / Number(PRECISION_FACTOR);
        parts.push(`Price: ${price.toFixed(significatDigits)} ${tokenIn.symbol} per ${tokenOut.symbol}`);
    } else {
        price = Number((quote.expectedAmountIn.scale18 * PRECISION_FACTOR) / quote.amountOut.scale18) / Number(PRECISION_FACTOR);
        parts.push(`Price: ${price.toFixed(significatDigits)} ${tokenIn.symbol} per ${tokenOut.symbol}`);
    }

    // Add reverse price information
    const reversePrice = 1 / price;
    parts.push(`Price: ${reversePrice.toFixed(significatDigits)} ${tokenOut.symbol} per ${tokenIn.symbol}`);

    // TODO: Add price impact warning if > 0.5%
    // const priceImpact = ???;
    // if (!priceImpact) {
    //     parts.push(`⚠️ Warning: No price impact information available, proceed with caution`);
    // } else if (quote.swapKind === SwapKind.GivenIn) {
    //     const priceImpact = parseFloat(priceImpact) / parseFloat(quote.reversePrice);
    //     if (priceImpact > 0.005) {
    //         parts.push(`⚠️  Warning: High price impact of ${(priceImpact * 100).toFixed(2)}%`);
    //     } else {
    //         parts.push(`Price Impact: ${(priceImpact * 100).toFixed(2)}%`);
    //     }
    // } else {
    // ...
    // }

    return parts.join('\n');
}

interface GetQuoteProps {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmount: string;
    swapKind: SwapKind;
}

/**
 * Get a quote for swapping tokens on the Balancer protocol.
 *
 * This function handles both exact-in swaps ("I want to swap ETH to get exactly 100 USDC")
 * and exact-out swaps ("I want to receive exactly 1 ETH paying in USDC").
 *
 * The function will:
 * 1. Validate the input parameters and chain support
 * 2. Fetch and validate the token information
 * 3. Query the Balancer Smart Order Router (SOR) for optimal swap paths
 * 4. Get up-to-date quotes by querying the blockchain
 */
export async function getSwapQuote(
    { chainName, tokenInAddress, tokenOutAddress, humanReadableAmount, swapKind }: GetQuoteProps,
    { notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validation
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmount)) return toResult(`Invalid swap amount: ${humanReadableAmount}`, true);

    // Get tokens
    const balancerTokenIn = await getBalancerTokenByAddress(chainName, tokenInAddress);
    if (!balancerTokenIn) return toResult(`Input token ${tokenInAddress} not found on ${chainName}`, true);
    const balancerTokenOut = await getBalancerTokenByAddress(chainName, tokenOutAddress);
    if (!balancerTokenOut) return toResult(`Output token ${tokenOutAddress} not found on ${chainName}`, true);

    // Notify with appropriate message based on swap kind
    if (swapKind === SwapKind.GivenIn) {
        notify(`Getting quote for swap ${humanReadableAmount} ${balancerTokenIn.symbol} -> ${balancerTokenOut.symbol} on ${chainName}`);
    } else {
        notify(`Getting quote for swap ${balancerTokenIn.symbol} -> ${humanReadableAmount} ${balancerTokenOut.symbol} on ${chainName}`);
    }

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get balancer swap amount using the appropriate token based on swap kind
    const tokenForAmount = swapKind === SwapKind.GivenIn ? balancerTokenIn : balancerTokenOut;
    const balancerSwapAmount = TokenAmount.fromHumanAmount(tokenForAmount, humanReadableAmount as `${number}`);

    // Get SOR paths
    const balancerClient = new BalancerApi('https://backend-v3.beets-ftm-node.com/', balancerChainId);
    const sorPaths = await balancerClient.sorSwapPaths.fetchSorSwapPaths({
        chainId: balancerChainId,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        swapKind,
        swapAmount: balancerSwapAmount,
    });
    notify(`Found ${sorPaths.length} paths for the swap`);

    const swap = new Swap({
        chainId: balancerChainId,
        paths: sorPaths,
        swapKind,
    });

    // Get RPC URL
    const publicClient = getProvider(chainId);
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) return toResult(`Chain ${chainName} not supported by viem`, true);

    // Get up to date swap result by querying onchain
    const updated = (await swap.query(rpcUrl)) as ExactInQueryOutput | ExactOutQueryOutput;

    return toResult(formatSwapQuote(updated, balancerTokenIn, balancerTokenOut));
}
