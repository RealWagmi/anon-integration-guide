import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { getUserOpenPositionBySymbol } from '../helpers/positions';
import { attachTakeProfitAndOrStopLossOrderToExistingPosition as attachTakeProfitAndOrStopLossOrderToExistingPositionHelper } from '../helpers/exchange';
import { SUPPORTED_MARKET_TYPES } from '../helpers/exchange';
import { convertTargetToAbsolutePrice } from '../helpers/amount';

interface Props {
    market: string;
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    takeProfitPrice: number | null;
    takeProfitType: 'absolute' | 'percentage' | null;
    stopLossPrice: number | null;
    stopLossType: 'absolute' | 'percentage' | null;
}

/**
 * Attach take profit and/or stop loss orders to an existing futures position
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the futures market
 * @param props.takeProfitPrice - Price at which the take profit order will be activated (set to 0 to cancel existing TP)
 * @param props.takeProfitType - Type of take profit price (absolute or percentage)
 * @param props.stopLossPrice - Price at which the stop loss order will be activated (set to 0 to cancel existing SL)
 * @param props.stopLossType - Type of stop loss price (absolute or percentage)
 * @param options HeyAnon SDK options
 * @returns A message confirming the operation or an error description
 */
export async function attachTakeProfitAndOrStopLossOrderToExistingPosition(
    { market, marketType, takeProfitPrice, takeProfitType, stopLossPrice, stopLossType }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        // Validate the market type
        const marketObject = await getMarketObject(exchange, market);
        const marketTypeInferredFromMarketSymbol = fromCcxtMarketToMarketType(marketObject);
        if (marketTypeInferredFromMarketSymbol !== marketType) {
            throw new Error(`Please clarify whether you want to trade on a ${marketType} or ${marketTypeInferredFromMarketSymbol} market`);
        }
        if (!SUPPORTED_MARKET_TYPES.includes(marketType as (typeof SUPPORTED_MARKET_TYPES)[number])) {
            throw new Error(`HeyAnon does not support markets of type ${marketType}`);
        }

        // Get the existing position
        const position = await getUserOpenPositionBySymbol(exchange, market);
        if (!position) {
            return toResult(`No open position found on ${market}. Please open a position first before attaching TP/SL orders.`, true);
        }

        // Determine position side for conversion
        const positionSide = position.side === 'long' ? 'long' : 'short';

        // Convert TP percentage values to absolute prices if needed
        // IMPORTANT: Preserve 0 as it's a special flag to cancel any existing TP order
        let absoluteTakeProfitPrice: number | null;
        if (takeProfitPrice === null || takeProfitPrice === 0) {
            absoluteTakeProfitPrice = takeProfitPrice;
        } else {
            if (takeProfitType === null) {
                throw new Error('Could not determine whether the take profit price is an absolute or percentage value');
            }
            absoluteTakeProfitPrice = await convertTargetToAbsolutePrice({
                targetValue: takeProfitPrice,
                targetType: takeProfitType,
                type: 'takeProfit',
                side: positionSide,
                direction: 'opposite', // trigger order opposite to the position side
                market: market,
                exchange: exchange,
            });
            if (takeProfitType === 'percentage') {
                notify(`${takeProfitPrice}% TP price: ${absoluteTakeProfitPrice}`);
            }
        }

        // Convert SL percentage values to absolute prices if needed
        // IMPORTANT: Preserve 0 as it's a special flag to cancel any existing SL order
        let absoluteStopLossPrice: number | null;
        if (stopLossPrice === null || stopLossPrice === 0) {
            absoluteStopLossPrice = stopLossPrice;
        } else {
            if (stopLossType === null) {
                throw new Error('Could not determine whether the stop loss price is an absolute or percentage value');
            }
            absoluteStopLossPrice = await convertTargetToAbsolutePrice({
                targetValue: stopLossPrice,
                targetType: stopLossType,
                type: 'stopLoss',
                side: positionSide,
                direction: 'opposite', // trigger order opposite to the position side
                market: market,
                exchange: exchange,
            });
            if (stopLossType === 'percentage') {
                notify(`${stopLossPrice}% SL price: ${absoluteStopLossPrice}`);
            }
        }

        // Create the orders
        await attachTakeProfitAndOrStopLossOrderToExistingPositionHelper(exchange, marketObject, absoluteTakeProfitPrice, absoluteStopLossPrice);

        // Build success message
        const messages: string[] = [];
        if (absoluteTakeProfitPrice !== null) {
            if (absoluteTakeProfitPrice === 0) {
                messages.push('Cancelled take profit order');
            } else {
                messages.push(`Set take profit at ${absoluteTakeProfitPrice}`);
            }
        }
        if (absoluteStopLossPrice !== null) {
            if (absoluteStopLossPrice === 0) {
                messages.push('Cancelled stop loss order');
            } else {
                messages.push(`Set stop loss at ${absoluteStopLossPrice}`);
            }
        }

        return toResult(`Successfully updated position on ${market}: ${messages.join(' and ')}`);
    } catch (error) {
        return toResult(`Error attaching TP/SL orders: ${error}`, true);
    }
}
