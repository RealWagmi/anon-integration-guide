// ---------------------------------------------------------------
// GLOBAL CONSTANTS
// ---------------------------------------------------------------
// UX and functional constants that are not exchange specific
// ---------------------------------------------------------------

/**
 * Maximum number of markets to show in results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_MARKETS_IN_RESULTS = 50;

/**
 * Maximum number of orders to show in results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_ORDERS_IN_RESULTS = 25;

/**
 * Maximum number of positions to show in results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_POSITIONS_IN_RESULTS = 25;

/**
 * By default, attempts of sending a limit order that will execute immediately
 * will be rejected.  This tolerance allows for a small deviation from the
 * current price.  Set to 0 to block all limit orders that will execute immediately.
 * Set to a few permille to allow for some deviation that might happens due to
 * current price fluctuations while the order is being placed.
 */
export const LIMIT_PRICE_TOLERANCE = 0.005;

/**
 * Possible account types
 */
export const ACCOUNT_TYPES = ['main', 'spot', 'funding', 'margin', 'cross', 'future', 'delivery', 'linear', 'swap', 'inverse', 'option'] as const;

// ---------------------------------------------------------------
// EXCHANGE BEHAVIOR CONSTANTS
// ---------------------------------------------------------------
// Describe exchange specific behaviors that are not documented
// in CCXT's own exchange.has and exchange.features properties.
// ---------------------------------------------------------------

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
