/**
 * Types of CEX markets
 *
 * This is slightly different from both the naming used by CCXT,
 * which is more technical (e.g. 'swap' instead of 'perpetual'),
 * and from the internal naming used by the exchange.
 *
 * See SUPPORTED_MARKET_TYPES for the subset of market types
 * supported by this HeyAnon integration.
 */
export const MARKET_TYPES = ['spot', 'perpetual', 'delivery', 'option', 'margin'] as const;

/**
 * Types of margin modes.
 */
export const MARGIN_MODES = ['cross', 'isolated', 'portfolio'] as const;

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
 * Account types supported by CCXT
 */
export const ACCOUNT_TYPES = ['main', 'spot', 'funding', 'margin', 'cross', 'future', 'delivery', 'linear', 'swap', 'inverse', 'option'] as const;
