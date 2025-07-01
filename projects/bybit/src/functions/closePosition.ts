import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { closeUserOpenPositionBySymbol } from '../helpers/positions';
import { getMarketObject } from '../helpers/markets';
import { getOrderById } from '../helpers/exchange';

interface Props {
    market: string;
}

/**
 * Close a single position by sending an opposite market order
 *
 * @param props - The function input parameters
 * @param props.market - The market symbol, e.g. "BTC/USDT:USDT"
 * @param options HeyAnon SDK options
 * @returns The order that was sent to close the position
 */
export async function closePosition({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Get market objects
        const marketObject = await getMarketObject(exchange, market);
        // Send the order to close the position
        const order = await closeUserOpenPositionBySymbol(exchange, market);
        notify(`Successfully submitted order with ID ${order.id}, now getting order status...`);
        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        // Return the order
        return toResult(`Successfully sent order to close your ${market} position.  Order details:\n${formatOrderMultiLine(orderObject, marketObject, ' - ', undefined, true)}`);
    } catch (error) {
        return toResult(`Error closing position: ${error}`, true);
    }
}
