import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { getUserOpenPositionBySymbol } from '../helpers/positions';
import { attachTakeProfitAndOrStopLossOrderToExistingPosition as attachTakeProfitAndOrStopLossOrderToExistingPositionHelper } from '../helpers/exchange';
import { SUPPORTED_MARKET_TYPES } from '../helpers/exchange';

interface Props {
    market: string;
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    takeProfitPrice: number | null;
    stopLossPrice: number | null;
}

/**
 * Attach take profit and/or stop loss orders to an existing futures position
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the futures market
 * @param props.takeProfitPrice - Price at which the take profit order will be activated (set to 0 to cancel existing TP)
 * @param props.stopLossPrice - Price at which the stop loss order will be activated (set to 0 to cancel existing SL)
 * @param options HeyAnon SDK options
 * @returns A message confirming the operation or an error description
 */
export async function attachTakeProfitAndOrStopLossOrderToExistingPosition(
    { market, marketType, takeProfitPrice, stopLossPrice }: Props,
    { exchange }: FunctionOptionsWithExchange,
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

        // Create the orders
        await attachTakeProfitAndOrStopLossOrderToExistingPositionHelper(exchange, marketObject, takeProfitPrice, stopLossPrice);

        // Build success message
        const messages: string[] = [];
        if (takeProfitPrice !== null) {
            if (takeProfitPrice === 0) {
                messages.push('Cancelled take profit order');
            } else {
                messages.push(`Set take profit at ${takeProfitPrice}`);
            }
        }
        if (stopLossPrice !== null) {
            if (stopLossPrice === 0) {
                messages.push('Cancelled stop loss order');
            } else {
                messages.push(`Set stop loss at ${stopLossPrice}`);
            }
        }

        return toResult(`Successfully updated position on ${market}: ${messages.join(' and ')}`);
    } catch (error) {
        return toResult(`Error attaching TP/SL orders: ${error}`, true);
    }
}
