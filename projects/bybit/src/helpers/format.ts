import { Balances, Leverage, LeverageTiers, MarketInterface, Order, Position, Ticker } from 'ccxt';
import { fromCcxtMarketToMarketType, getMarketExpiry } from './markets';
import { getUiInitialMargin } from './exchange';

/**
 * A stringified order object
 */
interface StringOrder {
    id: string;
    timestamp: string;
    symbol: string;
    marketType: string;
    type: string;
    side: string; // buy or sell
    adjustedSide: string; // buy or sell for spot markets, long or short for futures and options
    price: string;
    triggerPrice: string;
    takeProfitPrice: string;
    stopLossPrice: string;
    amount: string;
    filled: string;
    filledPercent: string;
    reduceOnly: string;
    status: string;
}

/**
 * A stringified position object
 */
interface StringPosition {
    id: string;
    timestamp: string;
    symbol: string;
    side: string;
    contracts: string;
    contractSize: string;
    entryPrice: string;
    markPrice: string;
    unrealizedPnl: string;
    unrealizedPnlPercentage: string;
    notional: string;
    initialMargin: string;
    marginRatio: string;
    collateral: string;
    marginMode: string;
    leverage: string;
    liquidationPrice: string;
    expiry: string; // delivery futures only
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
 * Show information about a market, including price, volume data and max leverage.
 *
 * @link https://docs.ccxt.com/#/?id=ticker-structure
 */
export function formatMarketInfo(market: MarketInterface, ticker: Ticker, leverageTiers?: LeverageTiers): string {
    const type = fromCcxtMarketToMarketType(market);
    const lowestTier = leverageTiers && leverageTiers[market.symbol] ? leverageTiers[market.symbol][0] : undefined;
    const rows = [
        `Type: ${type}`,
        market.expiryDatetime ? `Expiry/Delivery date: ${formatDate(getMarketExpiry(market))}` : '',
        `${market.settle ? `Settled in: ${market.settle}` : ''}`,
        `${lowestTier ? `Max leverage: ${lowestTier.maxLeverage}x${lowestTier.maxNotional ? ` (size < ${lowestTier.maxNotional} ${market.settle})` : ''}` : ''}`,
        `Last price: ${ticker.last} ${market.quote}`,
        `24h high: ${ticker.high} ${market.quote}`,
        `24h low: ${ticker.low} ${market.quote}`,
        `24h volume in ${market.quote}: ${ticker.quoteVolume}`,
        `24h volume in ${market.base}: ${ticker.baseVolume}`,
        `Market symbol: ${market.symbol}`,
    ];
    return rows.filter(Boolean).join('\n');
}

/**
 * Format a leverage structure for display in console.
 */
export function formatLeverageStructure(leverageStructure: Leverage): string {
    const rows = [`Leverage: ${leverageStructure.longLeverage}x`, `Margin mode: ${leverageStructure.marginMode}`];
    return rows.filter(Boolean).join('\n');
}

/**
 * Prepare an order for display in console.  Optional market parameter is
 * used to show ticker symbols
 */
function stringifyOrder(order: Order, market?: MarketInterface): StringOrder {
    const timestamp = extractTimestamp(order);
    const quoteSymbol = market ? ` ${market.quote}` : '';
    const baseSymbol = market ? ` ${market.base}` : '';
    const marketType = market ? fromCcxtMarketToMarketType(market) : 'N/A';
    // Computed adjusted side (buy/sell for spot markets, long/short for futures and options)
    let adjustedSide = order.side || 'N/A';
    if (order.side && marketType && marketType !== 'spot') {
        if (order.side === 'buy') {
            adjustedSide = 'long';
        } else if (order.side === 'sell') {
            adjustedSide = 'short';
        }
    }

    return {
        id: order.id || 'N/A',
        timestamp: timestamp ? formatDate(timestamp) : 'N/A',
        symbol: order.symbol || 'N/A',
        marketType: market ? fromCcxtMarketToMarketType(market) : 'N/A',
        type: order.type || 'N/A',
        side: order.side || 'N/A',
        adjustedSide,
        price: order.price !== undefined ? order.price.toString() + quoteSymbol : 'N/A',
        triggerPrice: order.triggerPrice !== undefined ? order.triggerPrice.toString() + quoteSymbol : 'N/A',
        takeProfitPrice: order.takeProfitPrice !== undefined ? order.takeProfitPrice.toString() + quoteSymbol : 'N/A',
        stopLossPrice: order.stopLossPrice !== undefined ? order.stopLossPrice.toString() + quoteSymbol : 'N/A',
        amount: order.amount !== undefined ? order.amount.toString() + baseSymbol : `${market?.base}/${market?.quote} position`,
        filled: order.filled !== undefined ? order.filled.toString() + baseSymbol : 'N/A',
        filledPercent: order.filled !== undefined ? ((order.filled / order.amount) * 100).toFixed(0) : 'N/A',
        reduceOnly: order.reduceOnly ? 'reduce-only' : 'N/A',
        status: order.status || 'N/A',
    };
}

/**
 * Format an order object into a multi-line string.
 */
export function formatOrderMultiLine(order: Order, market?: MarketInterface, prefix: string = '', delimiter: string = '\n', isCloseOrder: boolean = false): string {
    const { id, timestamp, symbol, marketType, type, adjustedSide, price, triggerPrice, stopLossPrice, takeProfitPrice, amount, filled, status, reduceOnly } = stringifyOrder(
        order,
        market,
    );
    let side = adjustedSide;
    if (isCloseOrder) {
        if (adjustedSide === 'long') {
            side = 'close short';
        } else if (adjustedSide === 'short') {
            side = 'close long';
        }
    }
    const rows = [
        `${prefix}Order ID: ${id}`,
        `${prefix}Timestamp: ${timestamp}`,
        `${prefix}Market: ${symbol}`,
        `${prefix}Market Type: ${marketType}`,
        `${prefix}Order type: ${type}`,
        `${prefix}Side: ${side}`,
        `${prefix}Reduce Only: ${reduceOnly !== 'N/A' ? 'Yes' : 'No'}`,
        `${prefix}Price: ${price}`,
        `${prefix}Trigger: ${triggerPrice}`,
        `${prefix}Take Profit: ${takeProfitPrice}`,
        `${prefix}Stop Loss: ${stopLossPrice}`,
        `${prefix}Amount: ${amount}`,
        `${prefix}Filled: ${filled}`,
        `${prefix}Status: ${status}`,
    ];
    return rows.join(delimiter);
}

/**
 * Format an order object into a single-line string.
 */
export function formatOrderSingleLine(order: Order, market?: MarketInterface, showStatus: boolean = true, prefix: string = ''): string {
    const { id, symbol, marketType, type, adjustedSide, price, triggerPrice, takeProfitPrice, stopLossPrice, amount, filledPercent, status, reduceOnly } = stringifyOrder(
        order,
        market,
    );
    const quoteSymbol = market ? ` ${market.quote}` : '';
    let parts = [
        `${marketType ? `${titleCase(marketType)} ` : ''}`,
        `${titleCase(type)}`,
        `${reduceOnly !== 'N/A' ? ` ${reduceOnly}` : ''}`,
        ` order`,
        ` to ${adjustedSide} ${amount}${quoteSymbol && triggerPrice === 'N/A' && price === 'N/A' ? ` for${quoteSymbol}` : ''}`,
        `${price !== 'N/A' ? ` @ ${price}` : ''}`,
        `${triggerPrice !== 'N/A' ? ` triggering at ${triggerPrice}` : ''}`,
        `${takeProfitPrice !== 'N/A' ? `, Take profit: ${takeProfitPrice}` : ''}`,
        `${stopLossPrice !== 'N/A' ? `, Stop loss: ${stopLossPrice}` : ''}`,
        ` (ID: ${id}, ${filledPercent === '0' ? '' : `filled: ${filledPercent}%, `}${showStatus ? `status: ${status}, ` : ''}market: ${symbol})`,
    ];

    return prefix + parts.join('');
}

/**
 * Prepare a position for display in console.  Optional market parameter is
 * used to show ticker symbols
 *
 * This is the definition of a position object from CCXT:
 * {
 *    'info': { ... },             // json response returned from the exchange as is
 *    'id': '1234323',             // string, position id to reference the position, similar to an order id
 *    'symbol': 'BTC/USD',         // uppercase string literal of a pair of currencies
 *    'timestamp': 1607723554607,  // integer unix time since 1st Jan 1970 in milliseconds
 *    'datetime': '2020-12-11T21:52:34.607Z',  // ISO8601 representation of the unix time above
 *    'isolated': true,            // boolean, whether or not the position is isolated, as opposed to cross where margin is added automatically
 *    'hedged': false,             // boolean, whether or not the position is hedged, i.e. if trading in the opposite direction will close this position or make a new one
 *    'side': 'long',              // string, long or short
 *    'contracts': 5,              // float, number of contracts bought, aka the amount or size of the position
 *    'contractSize': 100,         // float, the size of one contract in quote units
 *    'entryPrice': 20000,         // float, the average entry price of the position
 *    'markPrice': 20050,          // float, a price that is used for funding calculations
 *    'notional': 100000,          // float, the value of the position in the settlement currency
 *    'leverage': 100,             // float, the leverage of the position, related to how many contracts you can buy with a given amount of collateral
 *    'collateral': 5300,          // float, the maximum amount of collateral that can be lost, affected by pnl
 *    'initialMargin': 5000,       // float, the amount of collateral that is locked up in this position
 *    'maintenanceMargin': 1000,   // float, the mininum amount of collateral needed to avoid being liquidated
 *    'initialMarginPercentage': 0.05,      // float, the initialMargin as a percentage of the notional
 *    'maintenanceMarginPercentage': 0.01,  // float, the maintenanceMargin as a percentage of the notional
 *    'unrealizedPnl': 300,        // float, the difference between the market price and the entry price times the number of contracts, can be negative
 *    'liquidationPrice': 19850,   // float, the price at which collateral becomes less than maintenanceMargin
 *    'marginMode': 'cross',       // string, can be cross or isolated
 *    'percentage': 3.32,          // float, represents unrealizedPnl / initialMargin * 100
 * }
 *
 * This is a raw position object from CCXT:
 * [
 *  {
 *    info: { ...},
 *    id: undefined,
 *    symbol: 'BTC/USDT:USDT',
 *    contracts: 0.05,
 *    contractSize: 1,
 *    unrealizedPnl: 0.445,
 *    leverage: undefined,
 *    liquidationPrice: undefined,
 *    collateral: 4805.85,
 *    notional: 4806.295,
 *    markPrice: 96125.9,
 *    entryPrice: 96117,
 *    timestamp: 1746298104913,
 *    initialMargin: 475.31475,
 *    initialMarginPercentage: 0.09889421,
 *    maintenanceMargin: 19.22518,
 *    maintenanceMarginPercentage: 0.004,
 *    marginRatio: 0.004,
 *    datetime: '2025-05-03T18:48:24.913Z',
 *    marginMode: 'cross',
 *    marginType: 'cross',
 *    side: 'long',
 *    hedged: false,
 *    percentage: 0.09,
 *    stopLossPrice: undefined,
 *    takeProfitPrice: undefined
 *  }
 * ]
 *
 * Margin ratio is computed as:
 * marginRatio = maintenanceMargin / collateral + 5e-5
 *
 * @link https://docs.ccxt.com/#/README?id=positions
 */
function stringifyPosition(position: Position, market?: MarketInterface): StringPosition {
    const quoteSymbol = market ? ` ${market.quote}` : '';
    const settleSymbol = market ? ` ${market.settle}` : '';
    const initialMargin = getUiInitialMargin(position);

    return {
        id: position.id?.toString() || 'N/A',
        timestamp: position.timestamp ? formatDate(position.timestamp) : 'N/A',
        symbol: position.symbol || 'N/A',
        side: position.side ? (position.side as 'long' | 'short') : 'N/A',
        contracts: position.contracts !== undefined ? position.contracts.toString() : 'N/A',
        contractSize: position.contractSize !== undefined ? position.contractSize.toString() : 'N/A',
        entryPrice: position.entryPrice !== undefined ? position.entryPrice.toString() + quoteSymbol : 'N/A',
        markPrice: position.markPrice !== undefined ? position.markPrice.toString() + quoteSymbol : 'N/A',
        unrealizedPnl: position.unrealizedPnl !== undefined ? position.unrealizedPnl.toString() + settleSymbol : 'N/A',
        unrealizedPnlPercentage: position.percentage !== undefined ? position.percentage.toString() + '%' : 'N/A',
        notional: position.notional !== undefined ? position.notional.toString() + settleSymbol : 'N/A',
        initialMargin: initialMargin !== undefined ? initialMargin.toString() + settleSymbol : 'N/A',
        marginRatio: position.marginRatio !== undefined ? (position.marginRatio * 100).toFixed(2) + '%' : 'N/A',
        collateral: position.collateral !== undefined ? position.collateral.toString() + settleSymbol : 'N/A',
        marginMode: position.marginMode || 'N/A',
        leverage: position.leverage !== undefined ? position.leverage.toString() : 'N/A',
        liquidationPrice: position.liquidationPrice !== undefined ? position.liquidationPrice.toString() + quoteSymbol : 'N/A',
        expiry: market?.expiryDatetime ? formatDate(getMarketExpiry(market)) : 'N/A',
    };
}

/**
 * Format a position into a readable string spanning multiple lines
 */
export function formatPositionMultiLine(position: Position, market?: MarketInterface, prefix: string = '', delimiter: string = '\n'): string {
    const {
        // id,
        timestamp,
        symbol,
        side,
        contracts,
        contractSize,
        entryPrice,
        unrealizedPnl,
        unrealizedPnlPercentage,
        notional,
        // marginRatio,  // TODO: study what CCXT margin ratio really means
        initialMargin,
        // collateral,  // TODO: collateral does not seem to be consistent across exchanges
        marginMode,
        leverage,
        liquidationPrice,
        expiry,
    } = stringifyPosition(position, market);

    const rows = [
        `${prefix}Symbol: ${symbol}`,
        `${prefix}Side: ${side}`,
        // `${prefix}Margin Ratio: ${marginRatio}`,
        `${prefix}Entry Price: ${entryPrice}`,
        `${prefix}Liquidation Price: ${liquidationPrice}`,
        `${prefix}Notional: ${notional}`,
        `${prefix}PnL: ${unrealizedPnl}`,
        `${prefix}PnL Percentage: ${unrealizedPnlPercentage}`,
        `${prefix}Margin Mode: ${marginMode}`,
        `${prefix}Initial Margin: ${initialMargin}`,
        // `${position.marginMode === 'isolated' ? `${prefix}Collateral (margin + PnL): ${collateral}` : ''}`,
        `${prefix}Leverage: ${leverage}`,
        `${expiry !== 'N/A' ? `${prefix}Expiry/Delivery date: ${expiry}` : ''}`,
        `${prefix}Contracts: ${contracts}`,
        `${prefix}Contract Size: ${contractSize}`,
        `${prefix}Created: ${timestamp}`,
    ].filter(Boolean);

    return rows.join(delimiter);
}

/**
 * Format a position object into a single-line string.
 */
export function formatPositionSingleLine(position: Position, market?: MarketInterface, prefix: string = ''): string {
    const {
        id,
        // timestamp,
        symbol,
        side,
        // contracts,
        // contractSize,
        // entryPrice,
        // markPrice,
        // unrealizedPnl,
        unrealizedPnlPercentage,
        notional,
        // marginRatio, // CCXT margin ratio does not seem to be reliable enough to show
        initialMargin,
        marginMode,
        // leverage,
        liquidationPrice,
    } = stringifyPosition(position, market);

    const baseSymbol = market ? ` ${market.base}` : '';
    const marketType = market ? fromCcxtMarketToMarketType(market) : '';
    const shortMarketType = marketType ? marketType.replace('perpetual', 'perp') : '';

    let parts = [
        `${titleCase(side)}${baseSymbol}${shortMarketType ? ` ${shortMarketType}` : ''} position${id !== 'N/A' ? ` with ID ${id}` : ''} worth ${notional}`,
        ` (`,
        // `${marginRatio !== 'N/A' ? `margin ratio: ${marginRatio}, ` : ''}${collateral !== 'N/A' ? `collateral: ${collateral}, ` : ''}`,
        `${marginMode !== 'N/A' ? `${marginMode} margin, ` : ''}`,
        `${initialMargin !== 'N/A' ? `IM: ${initialMargin}, ` : ''}`,
        `${liquidationPrice !== 'N/A' ? `liq price: ${liquidationPrice}, ` : ''}`,
        `${unrealizedPnlPercentage !== 'N/A' ? `PnL: ${unrealizedPnlPercentage}, ` : ''}`,
        `market: ${symbol}`,
        // `created: ${timestamp}`,
        `)`,
    ];

    return prefix + parts.join('');
}

/**
 * Format a timestamp or a date object in YYYY-MM-DD HH:MM:SS format,
 * in UTC timezone, or return 'N/A' if the timestamp is null.
 */
export function formatDate(timestamp: number | Date | null, includeUTC: boolean = true): string {
    if (timestamp === null) {
        return 'N/A';
    }
    if (timestamp instanceof Date) {
        return timestamp.toISOString().replace('T', ' ').substring(0, 19) + (includeUTC ? ' UTC' : '');
    }
    return new Date(timestamp).toISOString().replace('T', ' ').substring(0, 19) + (includeUTC ? ' UTC' : '');
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
