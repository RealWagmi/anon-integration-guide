import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserLeverageOnMarket, setUserLeverageOnMarket as setUserLeverageOnMarketHelper } from '../helpers/leverage';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
    leverage: number;
}

/**
 * Set the user configured leverage for a specific market.
 *
 * @param props - The function input parameters
 * @param props.market - The symbol of the market
 * @param props.leverage - The leverage to set, e.g. 10 for 10x, 50 for 50x, etc.
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function setUserLeverageOnMarket({ market, leverage }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Ensure market type is correct
    const marketObject = await getMarketObject(exchange, market);
    const marketType = fromCcxtMarketToMarketType(marketObject);
    if (marketType !== 'perpetual' && marketType !== 'delivery') {
        return toResult(`This function supports only perpetual or delivery markets, but ${market} is a ${marketType} market`, true);
    }
    // Set leverage
    try {
        const currentLeverage = await getUserLeverageOnMarket(exchange, market);
        if (currentLeverage.longLeverage !== leverage) {
            await setUserLeverageOnMarketHelper(exchange, market, leverage);
            return toResult(`Successfully set leverage for ${market} to ${leverage}x`);
        } else {
            return toResult(`Leverage for ${market} is already set to ${leverage}x`);
        }
    } catch (error) {
        return toResult(`Error setting leverage: ${error}`, true);
    }
}
