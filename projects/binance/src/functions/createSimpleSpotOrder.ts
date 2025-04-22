import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';

interface Props {
    market: string;
    type: string;
    side: string;
    amount: number;
    price: number;
}

/**
 * Create a spot order.
 *
 * Docs: https://docs.ccxt.com/#/?id=placing-orders
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {string} props.type - Type of the order, either "limit" or "market"
 * @param {string} props.side - Side of the order, either "buy" or "sell"
 * @param {number} props.amount - Amount of the order, for example 1
 * @param {number} props.price - Price of the order, for example 100000
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createSimpleSpotOrder({ market, type, side, amount, price }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Print arguments
    console.log('market', market);
    console.log('type', type);
    console.log('side', side);
    console.log('amount', amount);
    console.log('price', price);
    // console.log('exchange', exchange);
    return toResult('Not implemented', true);
}
