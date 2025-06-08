import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { formatPositionMultiLine } from '../helpers/format';
import { getUserOpenPositionBySymbol } from '../helpers/positions';
import { getAccountMarginMode, EXCHANGE_SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL } from '../helpers/exchange';
import { fromCcxtMarketToMarketType, getMarketObject } from '../helpers/markets';

interface Props {
    market: string;
}

/**
 * Get details on the leveraged position held by the user on the given market
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.market - The symbol of the market
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the details on the position
 */
export async function getPositionOnMarket({ market }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Get market object
    const marketObject = await getMarketObject(exchange, market);
    const marketType = fromCcxtMarketToMarketType(marketObject);
    if (marketType !== 'perpetual' && marketType !== 'delivery') {
        return toResult(`This function supports only perpetual or delivery markets, but ${market} is a ${marketType} market`, true);
    }

    // Get position
    const position = await getUserOpenPositionBySymbol(exchange, market);
    if (!position) {
        return toResult(`No position found on ${market}`); // Not an error, just no position, so the LLM might try with a different market
    }

    // Fetch margin mode at the account level, if needed
    try {
        if (typeof position.marginMode === 'undefined' && !EXCHANGE_SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL) {
            const marginMode = await getAccountMarginMode(exchange);
            if (marginMode) {
                position.marginMode = marginMode;
            }
        }
    } catch (error) {
        notify(`Could not fetch margin mode for the account, margin metric might be inaccurate`);
    }

    return toResult(formatPositionMultiLine(position, marketObject));
}
