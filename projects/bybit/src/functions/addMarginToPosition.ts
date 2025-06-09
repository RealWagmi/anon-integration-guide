import { toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';
import { addOrReducePositionMargin } from '../helpers/exchange';

interface Props {
    market: string;
    amount: number;
}

/**
 * Add margin to an isolated margin position.
 *
 * @param props - The function input parameters
 * @param props.market - The market symbol, e.g. "BTC/USDT:USDT"
 * @param props.amount - The amount of margin to add, must be positive
 * @param options - HeyAnon SDK options
 * @returns The result of the operation
 */
export async function addMarginToPosition({ market, amount }: Props, { exchange }: FunctionOptionsWithExchange) {
    // Ensure amount is positive
    if (amount <= 0) {
        return toResult(`Amount of margin to add must be positive`, true);
    }
    // Get market object
    const marketObject = await getMarketObject(exchange, market);
    const marketType = fromCcxtMarketToMarketType(marketObject);
    if (marketType !== 'perpetual' && marketType !== 'delivery') {
        return toResult(`This function supports only perpetual or delivery markets, but ${market} is a ${marketType} market`, true);
    }
    // Add margin
    try {
        const result = await addOrReducePositionMargin(exchange, marketObject, amount);
        return toResult(
            `Successfully added ${amount} ${marketObject.settle} of margin to ${market}.  New initial margin is ${result.positionIM} and new liquidation price is ${result.liqPrice}`,
        );
    } catch (error) {
        return toResult(`Error adding margin: ${error}`, true);
    }
}
