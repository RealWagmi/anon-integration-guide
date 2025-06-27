import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserLeverageOnMarket, setUserMarginModeOnMarket } from '../helpers/leverage';
import { sanitizeMarketSymbol } from '../helpers/heyanon';

interface Props {
    market: string;
    marginMode: 'cross' | 'isolated';
}

/**
 * Set the user configured margin mode for a specific market.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market
 * @param {'cross' | 'isolated'} props.marginMode - The margin mode to set, either "cross" or "isolated"
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A message with the result of the operation
 */
export async function setMarginMode({ market, marginMode }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        market = sanitizeMarketSymbol(market, notify);
        const currentMarginMode = await getUserLeverageOnMarket(exchange, market);
        if (currentMarginMode.marginMode !== marginMode) {
            await setUserMarginModeOnMarket(exchange, market, marginMode);
            return toResult(`Successfully set margin mode for ${market} to ${marginMode}`);
        } else {
            return toResult(`Margin mode for ${market} is already set to ${marginMode}`);
        }
    } catch (error) {
        return toResult(`Error setting margin mode: ${error}`, true);
    }
}
