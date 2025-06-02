// ---------------------------------------------------------------
// EXCHANGE SPECIFIC CONSTANTS AND FUNCTIONS
// ---------------------------------------------------------------
// Anything specific to the exchange that is not covered by CCXT.
// ---------------------------------------------------------------

import { bybit, Exchange, Position } from 'ccxt';
import { MARGIN_MODES as HEYANON_MARGIN_MODES } from '../constants';

/**
 * The name of the exchange in CCXT, all lowercase.
 */
export const EXCHANGE_NAME = 'bybit';

/**
 * Settlement currencies supported by this integration.  We need to specify
 * them here because Bybit endpoint to query the user's position requires the
 * settleCoin parameter (https://bybit-exchange.github.io/docs/v5/position).
 *
 * Please note that Bybit also supports inverse markets (e.g. BTC/USD:BTC)
 * but we have not tested them yet with this integration.
 */
export const SETTLE_CURRENCIES = ['USDT', 'USDC'] as const;

/**
 * Margin modes supported by Bybit
 *
 * More details: https://www.bybit.com/en/help-center/article/Differences-Between-the-Margin-Modes-Under-the-Unified-Trading-Account
 */
export const MARGIN_MODES = ['ISOLATED_MARGIN', 'REGULAR_MARGIN', 'PORTFOLIO_MARGIN'] as const;

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
 * Whether the exchange supports setting margin mode at the market level
 *
 * Bybit only has account-level margin mode (https://bybit-exchange.github.io/docs/v5/position/cross-isolate)
 */
export const SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL = false;

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
 * Given a CCXT position, return the initial margin (IM) as shown in the BybitUI
 *
 * Screenshot from the Bybit UI: https://d.pr/i/1SYmN2
 */
export function getUiInitialMargin(ccxtPosition: Position): number | undefined {
    let initialMargin: number | undefined = undefined;
    if (ccxtPosition.marginMode === 'isolated') {
        initialMargin = ccxtPosition?.info?.positionBalance;
    } else if (ccxtPosition.marginMode === 'cross') {
        initialMargin = ccxtPosition?.info?.positionIM;
    }
    return initialMargin;
}

/**
 * Get the margin mode set at the account level
 */
export async function getAccountMarginMode(exchange: Exchange): Promise<(typeof HEYANON_MARGIN_MODES)[number] | undefined> {
    // Get margin mode from the API
    const accountInfo = await (exchange as bybit).privateGetV5AccountInfo();
    if (!accountInfo?.result?.marginMode) {
        throw new Error('Could not get account margin mode');
    }
    // Convert exchange-specific margin mode to the HeyAnon one
    switch (accountInfo.result.marginMode) {
        case 'ISOLATED_MARGIN':
            return 'isolated';
        case 'REGULAR_MARGIN':
            return 'cross';
        case 'PORTFOLIO_MARGIN':
            return 'portfolio';
    }
    throw new Error(`Unknown margin mode: ${accountInfo.result.marginMode}`);
}

/**
 * Specify here any option to apply to the exchange object
 */
export function applyExchangeOptions(exchange: Exchange): Exchange {
    // See https://discord.com/channels/690203284119617602/690203284727660739/1267775046366007339
    exchange.options['enableUnifiedAccount'] = true;
    return exchange;
}
