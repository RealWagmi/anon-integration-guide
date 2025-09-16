import { FunctionOptions, toResult } from '@heyanon/sdk';
import { getMarketBySymbol } from '../helpers/heyanon';
import { reduceMarginFromIsolatedPosition as reduceMarginFromIsolatedPositionHelper } from '../helpers/leverage';

interface Props {
	market: string;
	amount: number;
}

export async function reduceMarginFromIsolatedPosition({ market, amount }: Props, { getCcxtExchange }: FunctionOptions) {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		const marketObject = await getMarketBySymbol(exchange, market, true);
		market = marketObject.symbol;
		const result = await reduceMarginFromIsolatedPositionHelper(exchange, market, amount);
		if (result.status === 'failed') {
			return toResult(`Error reducing margin`, true);
		}
		return toResult(`Successfully reduced ${amount} ${marketObject.settle} of margin from ${market}`);
	} catch (error) {
		return toResult(`Error reducing margin: ${error}`, true);
	}
}
