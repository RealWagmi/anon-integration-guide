/**
 * Validate a percentage (e.g. 20 to indicate 20%), expressed as
 * a string.
 */
export function validatePercentage(percentage: string): boolean {
    const number = Number(percentage);
    return !isNaN(number) && number >= 0 && number <= 100;
}
