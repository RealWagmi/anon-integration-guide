import { DECIMAL_SCALES, ExactInQueryOutput, ExactOutQueryOutput, SwapKind, Token } from '@balancer/sdk';
import util from 'util';
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
        parts.push(`Swap ${quote.expectedAmountIn.toSignificant(significatDigits)} ${tokenOut.symbol}`);
        parts.push(`For ${quote.amountOut.toSignificant(significatDigits)} ${tokenIn.symbol}`);
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
