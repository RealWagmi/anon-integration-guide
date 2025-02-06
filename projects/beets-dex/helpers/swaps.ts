import { GqlSorGetSwapsResponse, GqlSorSwapType, GqlToken } from './beets/types';

/**
 * Given a quote for a swap returned by the API, format it into a human-readable
 * multi-line string, including information about the price, the amount of tokens
 * that will be swapped, those that will be received, the price impact, and the
 * route taken.
 *
 * Importantly, the string will contain a warning in the case that the price
 * impact is greater than 0.5%.
 */
export function formatSwapQuote(quote: GqlSorGetSwapsResponse, tokenIn: GqlToken, tokenOut: GqlToken): string {
    const parts = [];

    // Add basic swap information
    if (quote.swapType === GqlSorSwapType.ExactIn) {
        parts.push(`Swap ${quote.swapAmount} ${tokenIn.symbol}`);
        parts.push(`For ${quote.returnAmount} ${tokenOut.symbol}`);
    } else {
        parts.push(`Swap ${quote.returnAmount} ${tokenIn.symbol}`);
        parts.push(`For ${quote.swapAmount} ${tokenOut.symbol}`);
    }
    parts.push(`Price: ${quote.effectivePrice} ${tokenIn.symbol} per ${tokenOut.symbol}`);
    parts.push(`Price: ${quote.effectivePriceReversed} ${tokenOut.symbol} per ${tokenIn.symbol}`);

    // Add price impact warning if > 0.5%
    if (!quote.priceImpact?.priceImpact) {
        parts.push(`⚠️ Warning: No price impact information available, proceed with caution`);
    } else {
        const priceImpact = parseFloat(quote.priceImpact.priceImpact) / parseFloat(quote.effectivePriceReversed);
        if (priceImpact > 0.005) {
            parts.push(`⚠️  Warning: High price impact of ${(priceImpact * 100).toFixed(2)}%`);
        } else {
            parts.push(`Price Impact: ${(priceImpact * 100).toFixed(2)}%`);
        }
    }

    return parts.join('\n');
}
