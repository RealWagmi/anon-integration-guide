import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatPositionMultiLine } from '../helpers/format';
import { getMarketBySymbol } from '../helpers/heyanon';
import { getUserOpenPositionBySymbol } from '../helpers/positions';

interface Props {
	market: string;
}

/**
 * Get details on the position held by the user on the given market
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the details on the position
 */
export async function getPositionOnMarket({ market }: Props, { getCcxtExchange }: FunctionOptions): Promise<FunctionReturn> {
	const exchange = await getCcxtExchange('binanceusdm');
	// Get market object
	const marketObject = await getMarketBySymbol(exchange, market, true);
	market = marketObject.symbol;

	// Get position
	const position = await getUserOpenPositionBySymbol(exchange, market);
	if (!position) {
		return toResult(`No position found on ${market}`); // Not an error, just no position, so the LLM might try with a different market
	}

	return toResult(formatPositionMultiLine(position, marketObject));
}
