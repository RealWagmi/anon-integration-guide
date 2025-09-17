import { formatUnits } from 'viem';
import { DEFAULT_PRECISION } from '../constants';

/**
 * Convert a token amount to a human-readable string, with a
 * specified number of significant digits.
 *
 * Please note that Balancer SDK's TokenAmount.toSignificant
 * yields a different result, as it uses a fixed number of
 * DECIMAL digits, while this function really does significant
 * digits (just like %g formatter in printf).
 */
export function toHumanReadableAmount(
    amountInWei: bigint,
    decimals: number,
    minSignificantDigits = 2,
    maxSignificantDigits = DEFAULT_PRECISION,
    useThousandsSeparator = true,
): string {
    const stringWithFullPrecision = formatUnits(amountInWei, decimals);
    return toSignificant(Number(stringWithFullPrecision), minSignificantDigits, maxSignificantDigits, useThousandsSeparator);
}

/**
 * Format a number to a string with the given number of significant
 * digits, using a thousands separator if specified.
 */
export function toSignificant(
    num: number,
    minSignificantDigits: number | undefined = undefined,
    maxSignificantDigits: number | undefined = DEFAULT_PRECISION,
    useThousandsSeparator = true,
): string {
    return num.toLocaleString('en', {
        minimumSignificantDigits: minSignificantDigits,
        maximumSignificantDigits: maxSignificantDigits,
        useGrouping: useThousandsSeparator,
        notation: 'standard', // Ensures we don't get scientific notation
    });
}

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
