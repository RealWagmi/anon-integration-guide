import { Exchange, Position } from 'ccxt';

/**
 * Get all open positions of the user on the given exchange
 *
 * @link https://docs.ccxt.com/#/README?id=positions
 */
export async function getUserOpenPositions(exchange: Exchange): Promise<Position[]> {
    if (!exchange.has['fetchPositions']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open positions.`);
    }
    const positions = await exchange.fetchPositions();
    return positions;
}

/**
 * Get a specific user's position by market symbol
 *
 * Some exchanges including Binance do not allow to fetch a single
 * position by symbol.  In this case, we will fetch all open positions
 * and filter them by symbol.
 */
export async function getUserOpenPositionBySymbol(exchange: Exchange, symbol: string): Promise<Position> {
    if (exchange.id.toLowerCase() === 'binanceusdm') {
        return getUserPositionBySymbolFromAllPositions(exchange, symbol);
    }
    if (!exchange.has['fetchPosition']) {
        throw new Error(`Exchange ${exchange.name} does not support fetching open positions.`);
    }
    return exchange.fetchPosition(symbol);
}

/**
 * Fetch all positions for the user, then filter them by market symbol.
 */
async function getUserPositionBySymbolFromAllPositions(exchange: Exchange, symbol: string): Promise<Position> {
    const allPositions = await getUserOpenPositions(exchange);
    const position = allPositions.find((position) => position.symbol === symbol);
    if (typeof position === 'undefined') {
        return {} as Position; // Mimic what ccxt returns when the position is not found
    }
    return position;
}
