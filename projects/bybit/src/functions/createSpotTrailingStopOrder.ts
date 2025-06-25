import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    trailingStopDistance: number;
}

/**
 * Create a trailing stop order for a spot market.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.side - Side of the order; either "buy" or "sell" for spot markets
 * @param props.amount - Amount to trade (in either base or spend currency)
 * @param props.trailingStopDistance - Distance (absolute price) at which the trailing stop will be activated
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSpotTrailingStopOrder(_props: Props, _options: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    return toResult(`HeyAnon does not support trailing stop orders for SPOT markets.  Please consider creating a TP/SL or conditional order instead.`, true);
}
