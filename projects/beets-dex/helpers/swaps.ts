import { GqlSorGetSwapsResponse, GqlSorSwapType } from "./beets/types";

/**
 * Given a quote for a swap returned by the API, format it into a human-readable
 * multi-line string, including information about the price, the amount of tokens
 * that will be swapped, those that will be received, the price impact, and the
 * route taken.
 *
 * Importantly, the string will contain a warning in the case that the price
 * impact is greater than 0.5%.
 *
 * // TODO:
 * - Define SimplifiedSwap where prices, amounts and price impacts are
 *   already numbers
 * - Find a way to use token symbols in the output, instead of the token
 *   address
 */
export function formatSwapQuote(quote: GqlSorGetSwapsResponse): string {
    const parts = [];
    
    // Add basic swap information
    if (quote.swapType === GqlSorSwapType.ExactIn) {
        parts.push(`Swap ${quote.swapAmount} ${quote.tokenIn}`);
        parts.push(`For ${quote.returnAmount} ${quote.tokenOut}`);
    } else {
        parts.push(`Swap ${quote.returnAmount} ${quote.tokenIn}`);
        parts.push(`For ${quote.swapAmount} ${quote.tokenOut}`);
    }
    parts.push(`Price: ${quote.effectivePrice} ${quote.tokenIn} per ${quote.tokenOut}`);
    parts.push(`Price: ${quote.effectivePriceReversed} ${quote.tokenOut} per ${quote.tokenIn}`);
    
    // Add price impact warning if > 0.5%
    if (!quote.priceImpact?.priceImpact) {
        parts.push(`⚠️ Warning: No price impact information available, proceed with caution`);
    }
    else {
        const priceImpact = parseFloat(quote.priceImpact.priceImpact);
        if (priceImpact > 0.005) {
            parts.push(`⚠️  Warning: High price impact of ${(priceImpact * 100).toFixed(2)}%`);
        } else {
            parts.push(`Price Impact: ${(priceImpact * 100).toFixed(2)}%`);
        }
    }

    return parts.join('\n');
}
