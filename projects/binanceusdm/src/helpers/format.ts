import { Balances, MarketInterface, Order, Ticker } from 'ccxt';

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
    filledPercent: string;
    status: string;
}

/**
 * Format the full balance of an account into a multi-line string.
 */
export function formatBalances(balances: Balances, prefix: string = ''): string {
    const nonZeroBalances = Object.entries(balances.total || {})
        .filter(([, amount]) => parseFloat(amount as any) > 0)
        .sort(([currA], [currB]) => currA.localeCompare(currB));

    const rows: string[] = [];
    nonZeroBalances.forEach(([currency, amount]) => {
        const free = parseFloat((balances.free as any)[currency] || 0);
        const used = parseFloat((balances.used as any)[currency] || 0);
        if (used > 0) {
            rows.push(`${prefix}${currency}: ${amount} of which ${free} can be used to trade`);
        } else {
            rows.push(`${prefix}${currency}: ${amount}`);
        }
    });

    return rows.join('\n');
}

/**
 * Format a ticker object into a string.
 */
export function formatMarketInfo(market: MarketInterface, ticker: Ticker): string {
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
 *
 * Optional market parameter is used to show ticker
 * symbols.
 */
export function formatOrderMultiLine(order: Order, market?: MarketInterface, prefix: string = '', delimiter: string = '\n'): string {
    const { id, timestamp, symbol, type, side, price, triggerPrice, amount, filled, status } = stringifyOrder(order);

    const quoteSymbol = market ? ` ${market.quote}` : '';
    const baseSymbol = market ? ` ${market.base}` : '';

    const rows = [
        `${prefix}Order ID: ${id}`,
        `${prefix}Timestamp: ${timestamp}`,
        `${prefix}Market: ${symbol}`,
        `${prefix}Type: ${type}`,
        `${prefix}Side: ${side}`,
        `${prefix}Price: ${price}${quoteSymbol}`,
        `${prefix}Trigger: ${triggerPrice}${quoteSymbol}`,
        `${prefix}Amount: ${amount}${baseSymbol}`,
        `${prefix}Filled: ${filled}${baseSymbol}`,
        `${prefix}Status: ${status}`,
    ];
    return rows.join(delimiter);
}

/**
 * Format an order object into a single-line string.
 *
 * Optional market parameter is used to show ticker
 * symbols.
 */
export function formatOrderSingleLine(order: Order, market?: MarketInterface, showStatus: boolean = true, prefix: string = ''): string {
    const { id, timestamp, symbol, type, side, price, triggerPrice, amount, filled, filledPercent, status } = stringifyOrder(order);

    const quoteSymbol = market ? ` ${market.quote}` : '';
    const baseSymbol = market ? ` ${market.base}` : '';

    let parts = [
        `${titleCase(type)} order with ID ${id}`,
        `${triggerPrice !== 'N/A' ? ` that triggers at ${triggerPrice}${quoteSymbol},` : ''}`,
        ` to ${side} ${amount}${baseSymbol}${quoteSymbol ? ` for${quoteSymbol}` : ''}`,
        `${price !== 'N/A' ? ` @ ${price}${quoteSymbol}` : ''}`,
        ` (${filled === '0' ? '' : `filled: ${filledPercent}%, `}${showStatus ? `status: ${status}, ` : ''}created: ${timestamp}, market: ${symbol})`,
    ];

    return prefix + parts.join('');
}

/**
 * Prepare an order for display in console
 */
function stringifyOrder(order: Order): StringOrder {
    const timestamp = extractTimestamp(order);
    return {
        id: order.id || 'N/A',
        timestamp: timestamp ? formatDate(timestamp) : 'N/A',
        symbol: order.symbol || 'N/A',
        type: order.type || 'N/A',
        side: order.side || 'N/A',
        price: order.price !== undefined ? order.price.toString() : 'N/A',
        triggerPrice: order.triggerPrice !== undefined ? order.triggerPrice.toString() : 'N/A',
        amount: order.amount !== undefined ? order.amount.toString() : 'N/A',
        filled: order.filled !== undefined ? order.filled.toString() : 'N/A',
        filledPercent: order.filled !== undefined ? ((order.filled / order.amount) * 100).toFixed(0) : 'N/A',
        status: order.status || 'N/A',
    };
}

/**
 * Format a timestamp in YYYY-MM-DD HH:MM:SS format,
 * in UTC timezone.
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Return the Title Case version of the given string.
 */
export function titleCase(str: string): string {
    // Remove underscores and replace with spaces
    str = str.replace(/_/g, ' ');
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/**
 * Given a CCXT order, extract the timestamp.
 * Returns undefined if the timestamp is not found or is -1.
 */
export function extractTimestamp(order: Order): number | undefined {
    if (order.timestamp && order.timestamp !== -1) {
        return order.timestamp;
    }
    if (order.lastUpdateTimestamp && order.lastUpdateTimestamp !== -1) {
        return order.lastUpdateTimestamp;
    }
    return undefined;
}
