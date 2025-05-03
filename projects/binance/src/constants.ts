/**
 * Maximum number of orders to show in results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_ORDERS_IN_RESULTS = 25;

/**
 * By default, attempts of sending a limit order that will execute immediately
 * will be rejected.  This tolerance allows for a small deviation from the
 * current price.  Set to 0 to block all limit orders that will execute immediately.
 * Set to a few permille to allow for some deviation that might happens due to
 * current price fluctuations while the order is being placed.
 */
export const LIMIT_PRICE_TOLERANCE = 0.005;

/**
 * Minimum trailing delta in BIPS (100 BIPS = 1%)
 *
 * @link https://developers.binance.com/docs/binance-spot-api-docs/filters#trailing_delta
 */
export const MIN_TRAILING_DELTA = 10;

/**
 * Maximum trailing delta in BIPS (100 BIPS = 1%)
 *
 * @link https://developers.binance.com/docs/binance-spot-api-docs/filters#trailing_delta
 */
export const MAX_TRAILING_DELTA = 2000;
