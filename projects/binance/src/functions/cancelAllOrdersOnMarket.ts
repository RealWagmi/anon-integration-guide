import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderSingleLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { cancelAllOrders, getUserOpenOrders } from '../helpers/orders';

interface Props {
    market?: string;
}

/**
 * Cancel all open orders on a specific market.  Certain exchanges allow
 * to leave the market parameter blank and it will cancel all open orders
 * on all markets.
 *
 * @link https://docs.ccxt.com/#/README?id=canceling-orders
 *
 * @param {FunctionOptions} options
 * @param {Object} props - The function input parameters
 * @param {string|undefined} props.market - The market to cancel orders on, optional for certain exchanges
 * @returns {Promise<FunctionReturn>} A string confirming the order was cancelled, with the order details
 */
export async function cancelAllOrdersOnMarket({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Check if there are any open orders on the market
    const orders = await getUserOpenOrders(exchange);
    const ordersOnMarket = market ? orders.filter((order) => order.symbol === market) : orders;
    if (ordersOnMarket.length === 0) {
        return toResult(`No open orders found${market ? ` on ${market}` : ''}`); // not an error, just a message
    }

    // Notify the user
    let marketObject: MarketInterface | undefined;
    if (market) {
        const markets = await exchange.loadMarkets();
        marketObject = markets[market] as MarketInterface;
    }
    notify(`Orders to be cancelled:\n${ordersOnMarket.map((order) => formatOrderSingleLine(order, marketObject, false)).join('\n- ')}`);

    // Cancel the orders
    const cancelledOrders = await cancelAllOrders(exchange, market);

    return toResult(`Cancelled ${cancelledOrders.length} order${cancelledOrders.length === 1 ? '' : 's'} (${cancelledOrders.map((order) => order.id).join(', ')})`);
}
