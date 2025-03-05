import { MAX_DECIMALS, MAX_SIGNIFICANT_DIGITS } from '../../constants';

/**
 * Formats price to be in shape that Hyperliquid backend accepts
 */
export function _formatPrice(price: number, szDecimals: number): string {
    const maxDecimalPlaces = MAX_DECIMALS - szDecimals;
    const [integerPart, decimalPart] = price.toString().split('.');

    if (!decimalPart || Number(decimalPart) === 0) {
        return price.toString();
    }

    const formattedDecimalPart = decimalPart.slice(0, maxDecimalPlaces);
    const formattedPrice = Number(`${integerPart}.${formattedDecimalPart}`);

    // Remove leading zeros from integer part
    const significantIntegerPart = integerPart.replace(/^0+/, '');

    // Remove trailing zeros from decimal part
    const significantDecimalPart = formattedDecimalPart.replace(/0+$/, '');

    const numberOfSignificantDigits = significantIntegerPart.length + significantDecimalPart.length;

    if (numberOfSignificantDigits > MAX_SIGNIFICANT_DIGITS) {
        const decimalPartLength = formattedDecimalPart.length;

        let roundingFactor = decimalPartLength - (numberOfSignificantDigits - MAX_SIGNIFICANT_DIGITS);

        if (roundingFactor < 0) {
            roundingFactor = 0;
        }

        return formattedPrice.toFixed(roundingFactor);
    } else {
        return formattedPrice.toString();
    }
}
