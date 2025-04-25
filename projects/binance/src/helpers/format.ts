import { MarketInterface, Order, Ticker } from "ccxt";

/**
 * Format a ticker object into a string.
 */
export function formatMarketInfo(market: MarketInterface, ticker: Ticker) {
    const rows = [
        `Last price: ${ticker.last} ${market.quote}`,
        `Bid price: ${ticker.bid} ${market.quote}`,
        `Ask price: ${ticker.ask} ${market.quote}`,
        `24h high: ${ticker.high} ${market.quote}`,
        `24h low: ${ticker.low} ${market.quote}`,
        `24h volume in ${market.quote}: ${ticker.quoteVolume}`,
        `24h volume in ${market.base}: ${ticker.baseVolume}`
    ];
    return rows.join('\n');
}

/**
 * Format an order object into a multi-line string.
 */
export function formatOrderMultiLine(order: Order, prefix: string = '', delimiter: string = '\n') {

    const id = order.id || 'N/A';
    const timestamp = order.timestamp ? formatDate(order.timestamp) : 'N/A';
    const symbol = order.symbol || 'N/A';
    const type = order.type || 'N/A';
    const side = order.side || 'N/A';
    const price = order.price !== undefined ? order.price.toString() : 'N/A';
    const triggerPrice = order.triggerPrice !== undefined ? order.triggerPrice.toString() : 'N/A';
    const amount = order.amount !== undefined ? order.amount.toString() : 'N/A';
    const filled = order.filled !== undefined ? order.filled.toString() : 'N/A';
    const status = order.status || 'N/A'; // Should typically be 'open'

    const rows = [
        `${prefix}Order ID: ${id}`,
        `${prefix}Timestamp: ${timestamp}`,
        `${prefix}Market: ${symbol}`,
        `${prefix}Type: ${type}`,
        `${prefix}Side: ${side}`,
        `${prefix}Price: ${price}`,
        `${prefix}Trigger: ${triggerPrice}`,
        `${prefix}Amount: ${amount}`,
        `${prefix}Filled: ${filled}`,
        `${prefix}Status: ${status}`,
    ];
    return rows.join(delimiter);
}

/**
 * Format an order object into a single-line string.
 */
export function formatOrderSingleLine(order: Order, market: MarketInterface, showStatus: boolean = true, prefix: string = '') {
    const id = order.id || 'N/A';
    const timestamp = order.timestamp ? formatDate(order.timestamp) : 'N/A';
    const symbol = order.symbol || 'N/A';
    const type = order.type || 'N/A';
    const side = order.side || 'N/A';
    const price = order.price !== undefined ? order.price.toString() : 'N/A';
    const triggerPrice = order.triggerPrice !== undefined ? order.triggerPrice.toString() : 'N/A';
    const amount = order.amount !== undefined ? order.amount.toString() : 'N/A';
    const filled = order.filled !== undefined ? order.filled.toString() : 'N/A';
    const status = order.status || 'N/A'; // Should typically be 'open'

    let parts = [
        `${titleCase(type)} order with ID ${id}`,
        `${triggerPrice !== 'N/A' ? ` that triggers at ${triggerPrice} ${market.quote},` : ''}`,
        ` to ${side} ${amount} ${market.base} @ ${price} ${market.quote}`,
        ` (${filled === '0' ? '' : `filled: ${filled}, `}${showStatus ? `status: ${status}, ` : ''}date: ${timestamp}, market: ${symbol})`,
    ];

    return prefix + parts.join('');
}

/**
 * Format a timestamp in YYYY-MM-DD HH:MM:SS format,
 * in UTC timezone.
 */
export function formatDate(timestamp: number) {
    return new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Return the Title Case version of the given string.
 */
export function titleCase(str: string) {
    // Remove underscores and replace with spaces
    str = str.replace(/_/g, ' ');
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}
