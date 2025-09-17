import { toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { addOrReducePositionMargin } from '../helpers/exchange';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
    amount: number;
}

/**
 * Reduce margin from an isolated margin position.
 *
 * @param props - The function input parameters
 * @param props.market - The market symbol, e.g. "BTC/USDT:USDT"
 * @param props.amount - The amount of margin to reduce, must be positive
 * @param options - HeyAnon SDK options
 * @returns The result of the operation
 */
export async function reduceMarginFromPosition({ market, amount }: Props, { exchange }: FunctionOptionsWithExchange) {
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
    // Reduce margin
    try {
        const result = await addOrReducePositionMargin(exchange, marketObject, -amount);
        return toResult(
            `Successfully reduced ${amount} ${marketObject.settle} of margin from ${market}.  New initial margin is ${result.positionIM} and new liquidation price is ${result.liqPrice}`,
        );
    } catch (error) {
        return toResult(`Error reducing margin: ${error}`, true);
    }
}
