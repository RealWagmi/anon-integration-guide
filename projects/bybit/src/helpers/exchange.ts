// ---------------------------------------------------------------
// EXCHANGE SPECIFIC CONSTANTS AND FUNCTIONS
// ---------------------------------------------------------------
// Anything specific to the exchange that is not covered by CCXT.
// ---------------------------------------------------------------

import { Position } from 'ccxt';

/**
 * The name of the exchange in CCXT, all lowercase.
 */
export const EXCHANGE_NAME = 'bybit';

/**
 * Market types supported by the HeyAnon integration
 */
export const SUPPORTED_MARKET_TYPES = ['spot', 'perpetual', 'delivery'] as const;

/**
 * The types of orders that Binance API supports.
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/common-definition
 */
export const ORDER_TYPES = ['LIMIT', 'MARKET', 'STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET', 'TRAILING_STOP_MARKET'] as const;

/**
 * Whether the exchange supports limit price for trailing stop orders
 */
export const SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS = false;

/**
 * Minimum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const MIN_TRAILING_PERCENT = 0.1;

/**
 * Maximum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const MAX_TRAILING_PERCENT = 10;

/**
 * Given a CCXT position, return the margin as shown in the Binance UI
 *
 * Screenshot from the UI: https://d.pr/i/lHIh6h
 */
export function getUiMargin(ccxtPosition: Position): number | undefined {
    let margin: number | undefined = undefined;
    if (ccxtPosition.marginMode === 'isolated' && ccxtPosition.collateral && ccxtPosition.unrealizedPnl) {
        margin = ccxtPosition.collateral - ccxtPosition.unrealizedPnl;
    } else if (ccxtPosition.marginMode === 'cross' && ccxtPosition.initialMargin) {
        margin = ccxtPosition.initialMargin;
    }
    return margin;
}
