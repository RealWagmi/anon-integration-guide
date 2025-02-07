/**
 * Validate an amount of tokens, in decimal form, expressed as a string.
 *
 * By Decimal Form, we mean that the amount is expressed as a number
 * of actual human-readable tokens, not in wei or other units.
 */
export function validateTokenPositiveDecimalAmount(amount: string): boolean {
    const number = Number(amount);
    return !isNaN(number) && number > 0 && number < 1e18;
}

/**
 * Validate a slippage percentage (e.g. 20 to indicate 20%), expressed as
 * a string.
 */
export function validateSlippageAsPercentage(slippage: string): boolean {
    const number = Number(slippage);
    return !isNaN(number) && number >= 0 && number <= 100;
}
