import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderSingleLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getUserOpenOrders } from '../helpers/exchange';
import { getMarketObject } from '../helpers/markets';
import { cancelAllOrders } from '../helpers/orders';

interface Props {
    market: string | null;
}

/**
 * Cancel all open orders on a specific market.  Certain exchanges allow
 * to leave the market parameter blank and it will cancel all open orders
 * on all markets.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 *
 * @param props - The function input parameters
 * @param props.market - The market to cancel orders on, optional for certain exchanges
 * @param options
 * @returns A string confirming the order was cancelled, with the order details
 */
export async function cancelAllOrdersOnMarket({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Get the market object
        let marketObject: MarketInterface | undefined;
        if (market) {
            marketObject = await getMarketObject(exchange, market);
        }

        // Check if there are any open orders on the market
        const orders = await getUserOpenOrders(exchange);
        const ordersOnMarket = market ? orders.filter((order) => order.symbol === market) : orders;
        if (ordersOnMarket.length === 0) {
            return toResult(`No open orders found to cancel on market ${market}`); // not an error, just a message
        }

        // Notify the user
        notify(`Orders to be cancelled:\n${ordersOnMarket.map((order) => formatOrderSingleLine(order, marketObject, false, '- ')).join('\n')}`);

        // Cancel the orders
        await cancelAllOrders(exchange, market ?? undefined);

        return toResult(`Cancelled all orders on market ${market} (${ordersOnMarket.length} in total)`);
    } catch (error) {
        return toResult(`Error cancelling orders: ${error}`, true);
    }
}
