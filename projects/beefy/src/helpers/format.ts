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
 * Stringify an object, converting bigint values to strings.
 */
export function jsonStringify(obj: any, space: number | string | undefined = 2): string {
    return JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), space);
}
