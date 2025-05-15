import { toResult } from '@heyanon/sdk';
import { addMarginToIsolatedPosition as addMarginToIsolatedPositionHelper } from '../helpers/leverage';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketBySymbol } from '../helpers/heyanon';

interface Props {
    market: string;
    amount: number;
}

export async function addMarginToIsolatedPosition({ market, amount }: Props, { exchange, notify }: FunctionOptionsWithExchange) {
    try {
        const marketObject = await getMarketBySymbol(exchange, market, true, notify);
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
