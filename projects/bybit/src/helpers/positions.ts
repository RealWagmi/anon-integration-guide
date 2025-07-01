import { Exchange, Order, Position } from 'ccxt';
import { createSimpleOrder } from './orders';

/**
 * Get all open positions of the user on the given exchange
 *
 * @link https://docs.ccxt.com/#/README?id=positions
 */
export async function getUserOpenPositions(exchange: Exchange, params: Record<string, any> = {}): Promise<Position[]> {
    if (!exchange.has['fetchPositions']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open positions.`);
    }
    const positions = await exchange.fetchPositions(undefined, params);
    return positions;
}

/**
 * Get a specific user's position by market symbol
 *
 * Some exchanges including Binance do not allow to fetch a single
 * position by symbol.  In this case, we will fetch all open positions
 * and filter them by symbol.
 */
export async function getUserOpenPositionBySymbol(exchange: Exchange, symbol: string): Promise<Position | undefined> {
    // Ideally would use an `if (!exchange.has['fetchPosition'])` here, but
    // Binance would return true even though fetchPosition is supported only
    // for options markets (and not futures).
    try {
        return await exchange.fetchPosition(symbol);
    } catch (error) {
        return getUserPositionBySymbolFromAllPositions(exchange, symbol);
    }
}

/**
 * Fetch all positions for the user, then filter them by market symbol.
 * Returns undefined if the position is not found.
 */
async function getUserPositionBySymbolFromAllPositions(exchange: Exchange, symbol: string): Promise<Position | undefined> {
    const allPositions = await getUserOpenPositions(exchange);
    const position = allPositions.find((position) => position.symbol === symbol);
    return position;
}

/**
 * Close a specific user's position by market symbol
 *
 * Some exchanges including Binance and Bybit do not allow to close a single
 * position by symbol.  In this case, we will fetch all open positions
 * and filter them by symbol.
 */
export async function closeUserOpenPositionBySymbol(exchange: Exchange, symbol: string, position?: Position): Promise<Order> {
    if (!exchange.has['closePosition']) {
        return await closeUserPositionBySendingOppositeMarketOrder(exchange, symbol, position);
    }
    return await exchange.closePosition(symbol);
}

/**
 * Close a position by sending an opposite market order
 */
async function closeUserPositionBySendingOppositeMarketOrder(exchange: Exchange, symbol: string, position?: Position): Promise<Order> {
    // Fetch the position
    if (!position) {
        position = await getUserOpenPositionBySymbol(exchange, symbol);
    }
    if (!position) {
        throw new Error(`Could not find position for symbol ${symbol}`);
    }
    // Determine the side of the order to send
    let side: 'sell' | 'buy';
    if (position.side === 'long') {
        side = 'sell';
    } else if (position.side === 'short') {
        side = 'buy';
    } else {
        throw new Error(`Invalid position side: ${position.side}`);
    }
    // Compute the amount of the order
    if (!position.contracts || !position.contractSize) {
        throw new Error(`Could not compute position size for symbol ${symbol} (no contract size or contracts found)`);
    }
    const amount = position.contracts * position.contractSize;
    // Create and return the order
    const params: Record<string, any> = {};
    if (exchange.has['createReduceOnlyOrder']) {
        params.reduceOnly = true;
    }
    const order = await createSimpleOrder(exchange, symbol, side, amount, undefined, params);
    return order;
}
