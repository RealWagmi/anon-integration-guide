import { Exchange } from 'ccxt';
import { getMarketLastPriceBySymbol } from '../../spot/helpers/markets';

interface ConvertToBaseAmountParams {
	amount: number;
	amountCurrency: 'BASE' | 'QUOTE';
	market: string;
	limitPrice?: number | null;
	exchange: Exchange;
}

export async function convertToBaseAmount(params: ConvertToBaseAmountParams): Promise<number> {
	const { amount, amountCurrency, market, limitPrice, exchange } = params;

	// If already in base currency, return as-is
	if (amountCurrency === 'BASE') {
		return amount;
	}

	// Get the price to use for conversion
	const price = limitPrice || (await getMarketLastPriceBySymbol(market, exchange));

	return amount / price;
}
