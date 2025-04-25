import { MarketInterface, Order, Ticker } from 'ccxt';

/**
 * A stringified order object
 */
interface StringOrder {
    id: string;
    timestamp: string;
    symbol: string;
    type: string;
    side: string;
    price: string;
    triggerPrice: string;
    amount: string;
    filled: string;
    status: string;
}

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
        `24h volume in ${market.base}: ${ticker.baseVolume}`,
    ];
    return rows.join('\n');
}

/**
 * Format an order object into a multi-line string.
 */
export function formatOrderMultiLine(order: Order, market: MarketInterface, prefix: string = '', delimiter: string = '\n') {
    const { id, timestamp, symbol, type, side, price, triggerPrice, amount, filled, status } = stringifyOrder(order);

    const rows = [
        `${prefix}Order ID: ${id}`,
        `${prefix}Timestamp: ${timestamp}`,
        `${prefix}Market: ${symbol}`,
        `${prefix}Type: ${type}`,
        `${prefix}Side: ${side}`,
        `${prefix}Price: ${price} ${market.quote}`,
        `${prefix}Trigger: ${triggerPrice} ${market.quote}`,
        `${prefix}Amount: ${amount} ${market.base}`,
        `${prefix}Filled: ${filled} ${market.base}`,
        `${prefix}Status: ${status}`,
    ];
    return rows.join(delimiter);
}

/**
 * Format an order object into a single-line string.
 */
export function formatOrderSingleLine(order: Order, market: MarketInterface, showStatus: boolean = true, prefix: string = '') {
    const { id, timestamp, symbol, type, side, price, triggerPrice, amount, filled, status } = stringifyOrder(order);

    let parts = [
        `${titleCase(type)} order with ID ${id}`,
        `${triggerPrice !== 'N/A' ? ` that triggers at ${triggerPrice} ${market.quote},` : ''}`,
        ` to ${side} ${amount} ${market.base}`,
        `${price !== 'N/A' ? ` @ ${price} ${market.quote}` : ''}`,
        ` (${filled === '0' ? '' : `filled: ${filled} ${market.base}, `}${showStatus ? `status: ${status}, ` : ''}date: ${timestamp}, market: ${symbol})`,
    ];

    return prefix + parts.join('');
}

/**
 * Prepare an order for display in console
 */
function stringifyOrder(order: Order): StringOrder {
    return {
        id: order.id || 'N/A',
        timestamp: order.timestamp ? formatDate(order.timestamp) : 'N/A',
        symbol: order.symbol || 'N/A',
        type: order.type || 'N/A',
        side: order.side || 'N/A',
        price: order.price !== undefined ? order.price.toString() : 'N/A',
        triggerPrice: order.triggerPrice !== undefined ? order.triggerPrice.toString() : 'N/A',
        amount: order.amount !== undefined ? order.amount.toString() : 'N/A',
        filled: order.filled !== undefined ? order.filled.toString() : 'N/A',
        status: order.status || 'N/A',
    };
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
