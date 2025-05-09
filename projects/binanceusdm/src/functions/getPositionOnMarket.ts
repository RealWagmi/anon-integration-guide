import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatPositionMultiLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { completeMarketSymbol } from '../helpers/markets';
import { getUserOpenPositionBySymbol } from '../helpers/positions';

interface Props {
    market: string;
}

/**
 * Get details on the position held by the user on the given market
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the details on the position
 */
export async function getPositionOnMarket({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Infer market symbol from partial symbol
    if (market) {
        const originalMarket = market;
        market = completeMarketSymbol(market);
        if (originalMarket !== market) {
            notify(`Inferred market symbol from '${originalMarket}' to '${market}'`);
        }
    }

    // Get position
    const position = await getUserOpenPositionBySymbol(exchange, market);
    if (!position) {
        return toResult(`No position found on ${market}`, true);
    }

    // Get market object
    let marketObject: MarketInterface | undefined;
    if (market) {
        const markets = await exchange.loadMarkets();
        marketObject = markets[market] as MarketInterface;
    }

    return toResult(formatPositionMultiLine(position, marketObject));
}
