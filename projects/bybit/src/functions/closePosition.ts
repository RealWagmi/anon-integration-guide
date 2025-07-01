import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { closeUserOpenPositionBySymbol, getUserOpenPositionBySymbol } from '../helpers/positions';
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
        // Get the position
        const position = await getUserOpenPositionBySymbol(exchange, market);
        if (!position) {
            return toResult(`No open position found for ${market}`, true);
        }
        // Get position PNL
        const unrealizedPnl = Number(position.unrealizedPnl ?? 0);
        const realizedPnl = Number(position.realizedPnl ?? position?.info?.curRealisedPnl ?? 0); // second one is Bybit specific
        const totalPnl = unrealizedPnl + realizedPnl;
        // Send the order to close the position
        const order = await closeUserOpenPositionBySymbol(exchange, market, position);
        notify(`Successfully submitted market order with ID ${order.id}, now getting order status...`);
        // Get the order object
        const orderObject = await getOrderById(exchange, order.id, marketObject.symbol);
        // Get the order string
        const orderString = formatOrderMultiLine(orderObject, marketObject, ' - ', undefined, true);
        // Warn the user if the order was not filled at all
        if (orderObject.filled === 0) {
            return toResult(`Could not fill the order to close your position; order details:\n${orderString}`);
        }
        // Check whether the position was closed in full
        let filledPercent = 1;
        if (orderObject.filled !== orderObject.amount) {
            filledPercent = orderObject.filled / orderObject.amount;
        }
        // Compute the actual PNL based on the order filled percentage
        let actualPnl = totalPnl;
        if (filledPercent !== 1) {
            actualPnl = totalPnl * filledPercent;
        }
        const pnlString = actualPnl !== 0 ? `, with a P&L of approximately ${actualPnl.toFixed(2)} ${marketObject.settle}` : '';
        // Return the result
        if (filledPercent === 1) {
            return toResult(`Successfully closed your ${market} position${pnlString}.`);
        } else {
            return toResult(`Only ${(filledPercent * 100).toFixed(2)}% of the position was closed${pnlString}.\nOrder details:\n${orderString}`);
        }
    } catch (error) {
        return toResult(`Error closing position: ${error}`, true);
    }
}
