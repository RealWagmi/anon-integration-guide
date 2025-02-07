/**
 * Formats size to be in shape that Hyperliquid backend accepts
 */
export function _formatSize(x: number, szDecimals: number): string {
    const rounded = x.toFixed(szDecimals);
    let normalized = parseFloat(parseFloat(rounded).toFixed(szDecimals)).toString();
    if (normalized === '-0') normalized = '0';
    return normalized;
}
