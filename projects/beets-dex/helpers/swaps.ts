import { DECIMAL_SCALES, ExactInQueryOutput, ExactOutQueryOutput, SwapKind, Token, WAD } from '@balancer/sdk';
import { Address } from 'viem';
import { FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { anonChainNameToBalancerChainId, getDefaultRpcUrl } from '../helpers/chains';
import { BalancerApi, Swap, TokenAmount } from '@balancer/sdk';
import { getBalancerTokenByAddress, toHumanReadableAmount, toSignificant } from '../helpers/tokens';
import { DEFAULT_PRECISION, NATIVE_TOKEN_ADDRESS } from '../constants';
import { Slippage, SwapBuildCallInput, SwapBuildOutputExactIn, SwapBuildOutputExactOut } from '@balancer/sdk';
import { TransactionParams } from '@heyanon/sdk';

export interface GetQuoteProps {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmount: string;
    swapKind: SwapKind;
}

export interface GetQuoteResult {
    quote: ExactInQueryOutput | ExactOutQueryOutput;
    swap: Swap;
    tokenIn: Token;
    tokenOut: Token;
    swapKind: SwapKind;
}

interface BuildSwapTransactionProps {
    account: Address;
    quote: GetQuoteResult;
    slippageAsPercentage: `${number}`;
    deadline: bigint;
}

interface BuildSwapTransactionResult {
    transaction: TransactionParams;
    minAmountOutOrMaxAmountIn: TokenAmount;
    expectedAmount: TokenAmount;
    tokenIn: Token;
    tokenOut: Token;
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
 *
 * Source: https://docs.balancer.fi/integration-guides/swapping/swaps-with-sor-sdk.html
 */
export async function getSwapQuote(
    { chainName, tokenInAddress, tokenOutAddress, humanReadableAmount, swapKind }: GetQuoteProps,
    { notify, getProvider }: FunctionOptions,
): Promise<GetQuoteResult> {
    // Get tokens
    const balancerTokenIn = await getBalancerTokenByAddress(chainName, tokenInAddress);
    if (!balancerTokenIn) throw new Error(`Input token ${tokenInAddress} not found on ${chainName}`);
    const balancerTokenOut = await getBalancerTokenByAddress(chainName, tokenOutAddress);
    if (!balancerTokenOut) throw new Error(`Output token ${tokenOutAddress} not found on ${chainName}`);

    // Notify with appropriate message based on swap kind
    if (swapKind === SwapKind.GivenIn) {
        notify(`Getting quote for swap ${humanReadableAmount} ${balancerTokenIn.symbol} -> ${balancerTokenOut.symbol} on ${chainName}`);
    } else {
        notify(`Getting quote for swap ${balancerTokenIn.symbol} -> ${humanReadableAmount} ${balancerTokenOut.symbol} on ${chainName}`);
    }

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) throw new Error(`Chain ${chainName} not supported by SDK`);

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
    const chainId = getChainFromName(chainName);
    const publicClient = getProvider(chainId);
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) throw new Error(`Chain ${chainName} not supported by viem`);

    // Get up to date swap result by querying onchain
    const updated = (await swap.query(rpcUrl)) as ExactInQueryOutput | ExactOutQueryOutput;

    return { quote: updated, swap, tokenIn: balancerTokenIn, tokenOut: balancerTokenOut, swapKind };
}

/**
 * Given a quote for a swap returned by the Balancer SDK, format it into a
 * human-readable multi-line string, including information about the price, the
 * amount of tokens that will be swapped, those that will be received, the price
 * impact, and the route taken.
 */
export function formatSwapQuote(quote: GetQuoteResult, significatDigits = DEFAULT_PRECISION): string {
    const { quote: q, tokenIn, tokenOut } = quote;

    const parts = [];

    let price = 0;
    const PRECISION_FACTOR = DECIMAL_SCALES[significatDigits as keyof typeof DECIMAL_SCALES];
    if (q.swapKind === SwapKind.GivenIn) {
        // Add basic swap information
        const humanReadableAmountIn = toHumanReadableAmount(q.amountIn.amount, tokenIn.decimals, significatDigits);
        parts.push(`Swap ${humanReadableAmountIn} ${tokenIn.symbol}`);
        const humanReadableExpectedAmountOut = toHumanReadableAmount(q.expectedAmountOut.amount, tokenOut.decimals, significatDigits);
        parts.push(`For ${humanReadableExpectedAmountOut} ${tokenOut.symbol}`);
        // Add price information
        const fullPrecisionPrice = Number((q.amountIn.scale18 * WAD) / q.expectedAmountOut.scale18) / Number(WAD);
        parts.push(`Price: ${toSignificant(fullPrecisionPrice, 2, significatDigits)} ${tokenIn.symbol} per ${tokenOut.symbol}`);
    } else {
        // Add basic swap information
        const humanReadableExpectedAmountIn = toHumanReadableAmount(q.expectedAmountIn.amount, tokenIn.decimals, significatDigits);
        parts.push(`Swap ${humanReadableExpectedAmountIn} ${tokenIn.symbol}`);
        const humanReadableAmountOut = toHumanReadableAmount(q.amountOut.amount, tokenOut.decimals, significatDigits);
        parts.push(`For ${humanReadableAmountOut} ${tokenOut.symbol}`);
        // Add price information
        const fullPrecisionPrice = Number((q.expectedAmountIn.scale18 * WAD) / q.amountOut.scale18) / Number(WAD);
        parts.push(`Price: ${toSignificant(fullPrecisionPrice, 2, significatDigits)} ${tokenIn.symbol} per ${tokenOut.symbol}`);
    }

    // Add reverse price information
    // TODO: Why it is infinity sometimes?  Possibly more often with exactOut.
    const reversePrice = 1 / price;
    parts.push(`Price: ${reversePrice.toFixed(significatDigits)} ${tokenOut.symbol} per ${tokenIn.symbol}`);

    // TODO: Add price impact warning if > 0.5%
    // const priceImpact = ???;
    // if (!priceImpact) {
    //     parts.push(`⚠️ Warning: No price impact information available, proceed with caution`);
    // } else if (q.swapKind === SwapKind.GivenIn) {
    //     const priceImpact = parseFloat(priceImpact) / parseFloat(q.reversePrice);
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

/**
 * Builds the transaction data for executing a swap on Balancer.
 * This handles both exact-in and exact-out swaps.
 *
 * Returns the transaction data and amounts for notification purposes.
 */
export function buildSwapTransaction({ account, quote, slippageAsPercentage, deadline }: BuildSwapTransactionProps): BuildSwapTransactionResult {
    const { quote: q, swap, tokenIn, tokenOut, swapKind } = quote;

    // Allow the user to send the native token directly,
    // without the need to wrap it
    const wethIsEth = tokenIn.address === NATIVE_TOKEN_ADDRESS || tokenOut.address === NATIVE_TOKEN_ADDRESS;

    // Build the call input for the swap transaction
    // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
    let buildInput: SwapBuildCallInput;
    if (swap.protocolVersion === 2) {
        buildInput = {
            slippage: Slippage.fromPercentage(slippageAsPercentage),
            deadline,
            queryOutput: q,
            wethIsEth,
            sender: account as `0x${string}`,
            recipient: account as `0x${string}`,
        };
    } else {
        buildInput = {
            slippage: Slippage.fromPercentage(slippageAsPercentage),
            deadline,
            queryOutput: q,
            wethIsEth,
        };
    }

    const callData = swap.buildCall(buildInput);
    const transaction: TransactionParams = {
        target: callData.to,
        data: callData.callData,
        value: callData.value,
    };

    return {
        transaction,
        minAmountOutOrMaxAmountIn: swapKind === SwapKind.GivenIn ? (callData as SwapBuildOutputExactIn).minAmountOut : (callData as SwapBuildOutputExactOut).maxAmountIn,
        expectedAmount: swapKind === SwapKind.GivenIn ? (q as ExactInQueryOutput).expectedAmountOut : (q as ExactOutQueryOutput).expectedAmountIn,
        tokenIn,
        tokenOut,
    };
}
