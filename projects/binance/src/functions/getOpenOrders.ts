import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserOpenOrders } from '../helpers/orders';
import { MAX_ORDERS_IN_RESULTS } from '../constants';
import { formatOrderSingleLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';



/**
 * Get a list of the user's open orders, sorted in descending order of timestamp.
 *
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A string with the list of open orders, including: order ID, timestamp, amount, etc.
 */
export async function getOpenOrders({}: {}, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const orders = await getUserOpenOrders(exchange);

    if (!orders) {
        return toResult('No open orders found', true);
    }

    const markets = await exchange.loadMarkets();

    return toResult(
        orders
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_ORDERS_IN_RESULTS)
            .map((order, index) => formatOrderSingleLine(order, markets[order.symbol] as MarketInterface, false, `${index + 1}. `))
            .join('\n')
    );
}

