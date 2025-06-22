import { Exchange } from 'ccxt';
import { getMarketLastPriceBySymbol } from './markets';
import { getUserLeverageOnMarket } from './leverage';

export interface ConvertToBaseAmountParams {
    amount: number;
    amountCurrency: 'base' | 'spend';
    market: string;
    marketType: 'spot' | 'perpetual' | 'delivery';
    limitPrice?: number | null;
    exchange: Exchange;
}

/**
 * Convert an amount from either base or spend currency to base currency.
 *
 * For spot markets:
 * - If amountCurrency is 'base', return the amount as-is
 * - If amountCurrency is 'spend', divide by the market price
 *
 * For futures markets:
 * - If amountCurrency is 'base', return the amount as-is
 * - If amountCurrency is 'spend', multiply by leverage and divide by the market price
 *
 * @param params Conversion parameters
 * @returns Amount in base currency
 */
export async function convertToBaseAmount(params: ConvertToBaseAmountParams): Promise<number> {
    const { amount, amountCurrency, market, marketType, limitPrice, exchange } = params;

    // If already in base currency, return as-is
    if (amountCurrency === 'base') {
        return amount;
    }

    // Get the price to use for conversion
    const price = limitPrice || (await getMarketLastPriceBySymbol(market, exchange));

    // For spot markets, simply divide by price
    if (marketType === 'spot') {
        return amount / price;
    }

    // For futures markets, need to account for leverage
    const leverageStructure = await getUserLeverageOnMarket(exchange, market);
    const leverage = leverageStructure.longLeverage;
    return (amount * leverage) / price;
}
