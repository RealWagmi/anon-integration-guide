import { Exchange } from 'ccxt';
import { getMarketLastPriceBySymbol } from './markets';
import { getUserLeverageOnMarket } from './leverage';

export interface ConvertToBaseAmountParams {
    amount: number;
    amountCurrency: 'base' | 'spend';
    market: string;
    marketType: 'spot' | 'perpetual' | 'delivery';
    limitPrice?: number | null;
    exchange: Exchange;
}

/**
 * Convert an amount from either base or spend currency to base currency.
 *
 * For spot markets:
 * - If amountCurrency is 'base', return the amount as-is
 * - If amountCurrency is 'spend', divide by the market price
 *
 * For futures markets:
 * - If amountCurrency is 'base', return the amount as-is
 * - If amountCurrency is 'spend', multiply by leverage and divide by the market price
 *
 * @param params Conversion parameters
 * @returns Amount in base currency
 */
export async function convertToBaseAmount(params: ConvertToBaseAmountParams): Promise<number> {
    const { amount, amountCurrency, market, marketType, limitPrice, exchange } = params;

    // If already in base currency, return as-is
    if (amountCurrency === 'base') {
        return amount;
    }

    // Get the price to use for conversion
    const price = limitPrice || (await getMarketLastPriceBySymbol(market, exchange));

    // For spot markets, simply divide by price
    if (marketType === 'spot') {
        return amount / price;
    }

    // For futures markets, need to account for leverage
    const leverageStructure = await getUserLeverageOnMarket(exchange, market);
    const leverage = leverageStructure.longLeverage;
    return (amount * leverage) / price;
}

export interface ConvertTargetToAbsolutePriceParams {
    targetValue: number;
    targetType: 'absolute' | 'percentage';
    type: 'takeProfit' | 'stopLoss';
    side: 'buy' | 'sell' | 'long' | 'short';
    direction?: 'same' | 'opposite';
    market: string;
    limitPrice?: number | null;
    exchange: Exchange;
}

/**
 * Convert a target value (either absolute price or percentage) to an absolute price.
 *
 * For absolute type:
 * - Return the targetValue as-is
 *
 * For percentage type:
 * - The percentage represents the distance from current price
 * - The direction parameter indicates whether the trigger condition is in the
 *   same direction as the order side.  This is important for TP/SL orders
 *   that are created at the same time as the entry order, because in this
 *   case the conditions are opposite to the order side (you buy the position
 *   to later sell it).
 *
 * @param params Conversion parameters
 * @returns Absolute price
 */
export async function convertTargetToAbsolutePrice(params: ConvertTargetToAbsolutePriceParams): Promise<number> {
    const { targetValue, targetType, type, side, direction = 'same', market, limitPrice, exchange } = params;

    // If already absolute, return as-is
    if (targetType === 'absolute') {
        return targetValue;
    }

    // Validate that the percentage is between 0 and 100
    if (targetValue < 0 || targetValue > 100) {
        throw new Error(`Target value ${targetValue} is not a valid percentage, it must be between 0 and 100`);
    }

    // Validate the direction
    if (direction !== 'same' && direction !== 'opposite') {
        throw new Error(`Invalid direction: ${direction}, it must be either "same" or "opposite"`);
    }

    // Get the price to use for conversion
    const price = limitPrice || (await getMarketLastPriceBySymbol(market, exchange));

    // Convert percentage to decimal
    const percentageDecimal = targetValue / 100;

    if (side === 'long' || side === 'buy') {
        if (type === 'takeProfit') {
            return direction === 'same' ? price * (1 - percentageDecimal) : price * (1 + percentageDecimal);
        } else if (type === 'stopLoss') {
            return direction === 'same' ? price * (1 + percentageDecimal) : price * (1 - percentageDecimal);
        }
        throw new Error(`Invalid type: ${type}, it must be either "takeProfit" or "stopLoss"`);
    } else if (side === 'short' || side === 'sell') {
        if (type === 'takeProfit') {
            return direction === 'same' ? price * (1 + percentageDecimal) : price * (1 - percentageDecimal);
        } else if (type === 'stopLoss') {
            return direction === 'same' ? price * (1 - percentageDecimal) : price * (1 + percentageDecimal);
        }
        throw new Error(`Invalid type: ${type}, it must be either "takeProfit" or "stopLoss"`);
    } else {
        throw new Error(`Invalid side: ${side}, it must be either "buy" or "sell" or "long" or "short"`);
    }
}
