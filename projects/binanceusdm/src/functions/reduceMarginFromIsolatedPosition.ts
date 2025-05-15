import { toResult } from '@heyanon/sdk';
import { reduceMarginFromIsolatedPosition as reduceMarginFromIsolatedPositionHelper } from '../helpers/leverage';
import { FunctionOptionsWithExchange } from '../overrides';
import { getMarketBySymbol } from '../helpers/heyanon';

interface Props {
    market: string;
    amount: number;
}

export async function reduceMarginFromIsolatedPosition({ market, amount }: Props, { exchange, notify }: FunctionOptionsWithExchange) {
    try {
        const marketObject = await getMarketBySymbol(exchange, market, true, notify);
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
