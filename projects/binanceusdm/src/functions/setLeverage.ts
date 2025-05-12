import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { completeMarketSymbol } from '../helpers/markets';
import { setUserLeverageOnMarket } from '../helpers/leverage';

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
export async function setLeverage({ market, leverage }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
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
    // Set leverage
    await setUserLeverageOnMarket(exchange, market, leverage);
    return toResult(`Successfully set leverage for ${market} to ${leverage}x`);
}
