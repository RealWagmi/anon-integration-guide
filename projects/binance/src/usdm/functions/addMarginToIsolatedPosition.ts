import { FunctionOptions, toResult } from '@heyanon/sdk';
import { getMarketBySymbol } from '../helpers/heyanon';
import { addMarginToIsolatedPosition as addMarginToIsolatedPositionHelper } from '../helpers/leverage';

interface Props {
	market: string;
	amount: number;
}

export async function addMarginToIsolatedPosition({ market, amount }: Props, { getCcxtExchange }: FunctionOptions) {
	try {
		const exchange = await getCcxtExchange('binanceusdm');
		const marketObject = await getMarketBySymbol(exchange, market, true);
		market = marketObject.symbol;
		const result = await addMarginToIsolatedPositionHelper(exchange, market, amount);
		if (result.status === 'failed') {
			return toResult(`Error adding margin`, true);
		}
		return toResult(`Successfully added ${amount} ${marketObject.settle} of margin to ${market}`);
	} catch (error) {
		return toResult(`Error adding margin: ${error}`, true);
	}
}
