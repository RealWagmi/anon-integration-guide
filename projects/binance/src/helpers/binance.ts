/**
 * The types of orders that Binance API supports.
 *
 * @link https://developers.binance.com/docs/binance-spot-api-docs/enums#ordertypes
 */
export const BINANCE_ORDER_TYPES = ['LIMIT', 'LIMIT_MAKER', 'MARKET', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT', 'TRAILING_STOP_MARKET'] as const;
