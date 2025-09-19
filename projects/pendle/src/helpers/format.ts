/**
 * Format a number representing a dollar value to a string.  By default,
 * it will show two fractional digits.
 */
export function to$$$(num: number, minFractionDigits: number | undefined = 2, maxFractionDigits: number | undefined = 2): string {
    return num.toLocaleString('en', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    });
}

/**
 * Format a string to title case.
 */
export function toTitleCase(str: string): string {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
}
