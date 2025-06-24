import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { getUserOpenPositionBySymbol } from '../helpers/positions';

import { SUPPORTED_MARKET_TYPES, attachTrailingStopToExistingPosition as attachTrailingStopToExistingPositionHelper } from '../helpers/exchange';

interface Props {
    market: string;
    marketType: (typeof SUPPORTED_MARKET_TYPES)[number];
    trailingStopDistance: number;
    activationPrice: number | null;
}

/**
 * Attach a trailing stop to an existing futures position.  Pass 0 as the trailing distance to cancel any existing trailing stop attached to the position.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the futures market
 * @param props.trailingStopDistance - Distance (absolute price) at which the trailing stop will be activated.  Pass 0 to cancel any existing trailing stop attached to the position.
 * @param props.marketType - Type of market (futures or spot)
 * @param props.activationPrice - Optional activation price; ignored if trailingDist is 0.
 * @param options HeyAnon SDK options
 * @returns A message confirming the operation or an error description
 */
export async function attachTrailingStopToExistingPosition(
    { market, marketType, trailingStopDistance, activationPrice }: Props,
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
        await attachTrailingStopToExistingPositionHelper(exchange, marketObject, trailingStopDistance, activationPrice);

        // Build success message
        const messages: string[] = [];
        if (trailingStopDistance !== 0) {
            messages.push(`Set trailing stop at ${trailingStopDistance}`);
        }
        if (activationPrice !== null) {
            messages.push(`Set activation price at ${activationPrice}`);
        }

        return toResult(`Successfully updated position on ${market}: ${messages.join(' and ')}`);
    } catch (error) {
        return toResult(`Error attaching trailing stop: ${error}`, true);
    }
}
