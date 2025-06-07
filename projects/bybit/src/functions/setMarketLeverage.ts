import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserLeverageOnMarket, setUserLeverageOnMarket } from '../helpers/leverage';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
    leverage: number;
}

/**
 * Set the user configured leverage for a specific market.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market
 * @param {number} props.leverage - The leverage to set, e.g. 10 for 10x, 50 for 50x, etc.
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A message with the result of the operation
 */
export async function setMarketLeverage({ market, leverage }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
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
            await setUserLeverageOnMarket(exchange, market, leverage);
            return toResult(`Successfully set leverage for ${market} to ${leverage}x`);
        } else {
            return toResult(`Leverage for ${market} is already set to ${leverage}x`);
        }
    } catch (error) {
        return toResult(`Error setting leverage: ${error}`, true);
    }
}
