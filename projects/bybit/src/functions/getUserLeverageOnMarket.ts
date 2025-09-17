import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserLeverageOnMarket as getUserLeverageOnMarketHelper } from '../helpers/leverage';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
}

/**
 * Get the user configured leverage for a specific market.
 *
 * @param props - The function input parameters
 * @param props.market - The symbol of the market
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function getUserLeverageOnMarket({ market }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Ensure market type is correct
    const marketObject = await getMarketObject(exchange, market);
    const marketType = fromCcxtMarketToMarketType(marketObject);
    if (marketType !== 'perpetual' && marketType !== 'delivery') {
        return toResult(`This function supports only perpetual or delivery markets, but ${market} is a ${marketType} market`, true);
    }
    // Get leverage
    try {
        const leverage = await getUserLeverageOnMarketHelper(exchange, market);
        return toResult(`Your leverage for ${market} is ${leverage.longLeverage}x`);
    } catch (error) {
        return toResult(`Error getting leverage: ${error}`, true);
    }
}
