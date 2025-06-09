// ---------------------------------------------------------------
// EXCHANGE SPECIFIC CONSTANTS AND FUNCTIONS
// ---------------------------------------------------------------
// Anything specific to the exchange that is not covered by CCXT.
// ---------------------------------------------------------------

import { bybit, Exchange, MarketInterface, Position } from 'ccxt';
import { MARGIN_MODES as HEYANON_MARGIN_MODES } from '../constants';

export interface AddOrReducePositionMarginResult {
    liqPrice: string;
    riskId: string;
    positionStatus: string;
    positionIM: string;
    positionMM: string;
}

/**
 * The name of the exchange in CCXT, all lowercase.
 */
export const EXCHANGE_NAME = 'bybit';

/**
 * Margin modes supported by Bybit
 *
 * More details: https://www.bybit.com/en/help-center/article/Differences-Between-the-Margin-Modes-Under-the-Unified-Trading-Account
 */
export const EXCHANGE_MARGIN_MODES = ['ISOLATED_MARGIN', 'REGULAR_MARGIN', 'PORTFOLIO_MARGIN'] as const;

/**
 * Whether the exchange supports limit price for trailing stop orders
 */
export const EXCHANGE_SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS = false;

/**
 * Whether the exchange supports setting margin mode at the market level
 *
 * Bybit only has account-level margin mode (https://bybit-exchange.github.io/docs/v5/position/cross-isolate)
 */
export const EXCHANGE_SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL = false;

/**
 * Minimum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const EXCHANGE_MIN_TRAILING_PERCENT = 0.1;

/**
 * Maximum trailing percentage for trailing stop orders
 *
 * @link https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api
 */
export const EXCHANGE_MAX_TRAILING_PERCENT = 10;

/**
 * Settlement currencies supported by this HeyAnon integration.  We need to
 * specify them here because Bybit endpoint to query the user's position requires
 * the settleCoin parameter (https://bybit-exchange.github.io/docs/v5/position).
 *
 * Please note that Bybit also supports inverse markets (e.g. BTC/USD:BTC)
 * but we have not tested them yet with this integration.
 */
export const SUPPORTED_SETTLE_CURRENCIES = ['USDT', 'USDC'] as const;

/**
 * Market types supported by this HeyAnon integration
 */
export const SUPPORTED_MARKET_TYPES = ['spot', 'perpetual', 'delivery'] as const;

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
 * Add margin to an existing position; will throw an error if the account
 * margin mode is not isolated.
 *
 * @link https://bybit-exchange.github.io/docs/v5/position/manual-add-margin
 *
 * @param exchange - The exchange object
 * @param marketObject - The market object
 * @param amount - The amount of margin to add, can be a positive or negative number
 * @param category - The category of the position (linear or inverse)
 * @param positionIdx - Required only for hedge mode position: 0: One-Way Mode, 1: Buy side of both side mode, 2: Sell side of both side mode
 * @returns The risk data about the position, including the new liquidation price and the new margin
 */
export async function addOrReducePositionMargin(
    exchange: Exchange,
    marketObject: MarketInterface,
    amount: number,
    category: 'linear' | 'inverse' = 'linear',
    positionIdx: 0 | 1 | 2 = 0,
): Promise<AddOrReducePositionMarginResult> {
    const params = {
        category,
        symbol: marketObject.id,
        margin: amount.toString(),
        positionIdx: positionIdx.toString(),
    };
    console.log('params', params);
    const response = await (exchange as bybit).privatePostV5PositionAddMargin(params);
    console.log('response', response);
    if (response.retMsg !== 'OK') {
        throw new Error(`Could not add margin to position: ${response.retMsg}`);
    }
    const result: AddOrReducePositionMarginResult = {
        liqPrice: response.result.liqPrice,
        riskId: response.result.riskId,
        positionStatus: response.result.positionStatus,
        positionIM: response.result.positionIM,
        positionMM: response.result.positionMM,
    };
    console.log('result', result);
    return result;
}

/**
 * Specify here any option to apply to the exchange object
 */
export function applyExchangeOptions(exchange: Exchange): Exchange {
    // See https://discord.com/channels/690203284119617602/690203284727660739/1267775046366007339
    exchange.options['enableUnifiedAccount'] = true;
    return exchange;
}
