import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { completeMarketSymbol } from '../helpers/markets';
import { formatLeverageStructure } from '../helpers/format';
import { getUserLeverageOnMarket } from '../helpers/leverage';

interface Props {
    market: string;
}

/**
 * Get the user configured leverage (10x, 50x, etc) and margin mode (isolated, cross) for a specific market.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market to get information for
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the requested information
 */
export async function getUserLeverageAndMarginModeOnMarket({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Infer market symbol from partial symbol
        const originalMarket = market;
        market = completeMarketSymbol(market);
        if (originalMarket !== market) {
            notify(`Inferred market symbol from '${originalMarket}' to '${market}'`);
        }
        // Fetch market object
        const markets = await exchange.loadMarkets();
        const marketObject = markets[completeMarketSymbol(market)];
        if (!marketObject) {
            return toResult(`No market found with symbol '${market}'.  Ask "Show me markets for token <your token>" and try again with full market symbol`, true);
        }
        // Fetch market leverage structure
        const leverageStructure = await getUserLeverageOnMarket(exchange, market);
        if (!leverageStructure) {
            return toResult('No leverage and margin mode info found for market ' + market, true);
        }
        // Check that the leverage structure is valid
        if (leverageStructure.longLeverage !== leverageStructure.shortLeverage) {
            return toResult(`Found different values for long and short leverage on market ${market}: Not supported yet`, true);
        }
        return toResult(formatLeverageStructure(leverageStructure));
    } catch (error) {
        return toResult(`Error getting leverage: ${error}`, true);
    }
}
