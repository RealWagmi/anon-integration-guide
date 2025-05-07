import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { MAX_POSITIONS_IN_RESULTS } from '../constants';
import { formatPositionSingleLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getUserOpenPositions } from '../helpers/positions';

/**
 * Get a list of the user's open positions, sorted in descending order of timestamp.
 *
 * @param {FunctionOptions} options
 * @returns {Promise<FunctionReturn>} A string with the list of open positions, including: position ID, notional, PNL, timestamp, etc.
 */
export async function getPositions({}: {}, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    const positions = await getUserOpenPositions(exchange);
    if (positions.length === 0) {
        return toResult('No open positions found', true);
    }

    const markets = await exchange.loadMarkets();

    const mostRecentNPositions = positions.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, MAX_POSITIONS_IN_RESULTS);

    const rows = [
        `Found ${positions.length} open positions ${positions.length > MAX_POSITIONS_IN_RESULTS ? `(showing first ${MAX_POSITIONS_IN_RESULTS})` : ''}:`,
        ...mostRecentNPositions.map((position, index) => formatPositionSingleLine(position, markets[position.symbol] as MarketInterface, `${index + 1}. `)),
    ];

    return toResult(rows.join('\n'));
}
