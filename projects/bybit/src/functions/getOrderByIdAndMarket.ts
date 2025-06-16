import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getOrderById } from '../helpers/exchange';

interface Props {
    id: string;
    market: string | null;
}

/**
 * Get details on the given order by its ID and market symbol.  Certain
 * exchanges do not require the market parameter to be specified.
 *
 * @param props - The function input parameters
 * @param props.id - The ID of the order to get details on
 * @param props.market - The symbol of the market, optional for certain exchanges
 * @param options - HeyAnon SDK options
 * @returns The result of the operation
 */
export async function getOrderByIdAndMarket({ id, market }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Get order
        const order = await getOrderById(exchange, id, market ?? undefined);

        // Get market object
        let marketObject: MarketInterface | undefined;
        if (market) {
            const markets = await exchange.loadMarkets();
            marketObject = markets[market] as MarketInterface;
        }

        return toResult(formatOrderMultiLine(order, marketObject));
    } catch (error) {
        return toResult(`Error getting order: ${error}`, true);
    }
}
