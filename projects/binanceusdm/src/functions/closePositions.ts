import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatOrderMultiLine } from '../helpers/format';
import { closeUserOpenPositionBySymbol } from '../helpers/positions';
import { getMarketBySymbol } from '../helpers/heyanon';

interface Props {
    market: string;
}

/**
 * Close a single position by sending an opposite market order
 *
 * @param {Object} props - The function input parameters
 * @param {FunctionOptions} options HeyAnon SDK options
 * @param {string} props.market - The market symbol, e.g. "BTC/USDT:USDT"
 * @returns {Promise<FunctionReturn>} The order that was sent to close the position
 */
export async function closePosition({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Get market objects
        const marketObject = await getMarketBySymbol(exchange, market, true, notify);
        market = marketObject.symbol;
        // Send the order to close the position
        const order = await closeUserOpenPositionBySymbol(exchange, market);
        if (!order) {
            return toResult(`Could not send order to close position for symbol ${market}`, true);
        }
        // Return the order
        return toResult(`Successfully sent order to close your ${market} position.  Order details:\n${formatOrderMultiLine(order, marketObject, ' - ')}`);
    } catch (error) {
        return toResult(`Error closing position: ${error}`, true);
    }
}
