import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getOrderById } from '../helpers/orders';
import { completeMarketSymbol } from '../helpers/markets';

interface Props {
    id: string;
    market: string | null;
}

/**
 * Get details on the given order by its ID and market symbol.  Certain
 * exchanges do not require the market parameter to be specified.
 *
 * @param {FunctionOptions} options HeyAnon SDK options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to get details on
 * @param {string|null} props.market - The symbol of the market, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string with the details on the order
 */
export async function getOrderByIdAndMarket({ id, market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Infer market symbol from partial symbol
    if (market) {
        const originalMarket = market;
        market = completeMarketSymbol(market);
        if (originalMarket !== market) {
            notify(`Inferred market symbol from '${originalMarket}' to '${market}'`);
        }
    }
    // Get order
    const order = await getOrderById(exchange, id, market ?? undefined);
    if (!order) {
        return toResult('Order not found', true);
    }

    // Get market object
    let marketObject: MarketInterface | undefined;
    if (market) {
        const markets = await exchange.loadMarkets();
        marketObject = markets[market] as MarketInterface;
    }

    return toResult(formatOrderMultiLine(order, marketObject));
}
