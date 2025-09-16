import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatLeverageStructure } from '../helpers/format';
import { getUserLeverageOnMarket } from '../helpers/leverage';
import { completeMarketSymbol } from '../helpers/markets';

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
export async function getUserLeverageAndMarginModeOnMarket({ market }: Props, { getCcxtExchange }: FunctionOptions): Promise<FunctionReturn> {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		market = completeMarketSymbol(market);

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
		return toResult(formatLeverageStructure(leverageStructure));
	} catch (error) {
		return toResult(`Error getting leverage: ${error}`, true);
	}
}
