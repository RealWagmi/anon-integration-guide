import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getOrderById } from '../helpers/orders';

interface Props {
    id: string;
    symbol: string; // Binance specific
}

/**
 * Get details on the given order by its ID and market symbol
 *
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string} props.id - The ID of the order to get details on
 * @param {string} props.market - The symbol of the market
 * @returns {Promise<FunctionReturn>} A string with the details on the order
 */
export async function getOrderByIdAndSymbol({ id, symbol }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const order = await getOrderById(exchange, id, symbol);
    if (!order) {
        return toResult('Order not found', true);
    }

    const markets = await exchange.loadMarkets();
    const market = markets[symbol] as MarketInterface;

    return toResult(formatOrderMultiLine(order, market));
}
