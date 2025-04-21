import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';

interface Props {
    symbol: string;
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
 * @param {string} props.symbol - Symbol of the pair to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param {string} props.type - Type of the order, either "limit" or "market"
 * @param {string} props.side - Side of the order, either "buy" or "sell"
 * @param {number} props.amount - Amount of the order, for example 1
 * @param {number} props.price - Price of the order, for example 100000
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A message confirming the order or an error description
 */
export async function createSimpleSpotOrder({ symbol, type, side, amount, price }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Print arguments
    console.log('symbol', symbol);
    console.log('type', type);
    console.log('side', side);
    console.log('amount', amount);
    console.log('price', price);
    console.log('options', options);
    return toResult('Not implemented', true);
}
