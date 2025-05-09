import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { MAX_POSITIONS_IN_RESULTS } from '../constants';
import { formatPositionSingleLine } from '../helpers/format';
import { MarketInterface } from 'ccxt';
import { getUserOpenPositions } from '../helpers/positions';

interface Props {
    minMarginRatioPercentage: number | null;
}

/**
 * Get a list of the user's open positions, sorted in descending order of timestamp.
 *
 * @param {Object} props - The function input parameters
 * @param {number|null} props.minMarginRatioPercentage - Show only positions with a margin ratio percentage greater than or equal to this value.  Useful to see positions that are at risk of liquidation.  Defaults to 0% to show all positions.
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the list of open positions, including: position ID, notional, PNL, timestamp, etc.
 */
export async function getPositions({ minMarginRatioPercentage }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    // Get all open positions
    let positions = await getUserOpenPositions(exchange);
    if (positions.length === 0) {
        return toResult('No open positions found'); // not an error, just a message
    }

    // Filter positions by margin ratio percentage
    if (minMarginRatioPercentage) {
        const minMarginRatio = minMarginRatioPercentage / 100;
        if (minMarginRatio < 0 || minMarginRatio > 1) {
            return toResult(`Invalid minMarginRatioPercentage: ${minMarginRatioPercentage}.  Must be between 0 and 100`, true);
        }
        // Filter positions by margin ratio percentage; if for a position no
        // margin ratio is available, show it as a high risk position
        positions = positions.filter((position) => (position.marginRatio ? position.marginRatio >= minMarginRatio : true));
        if (positions.length === 0) {
            return toResult(`No positions found with a margin ratio percentage greater than or equal to ${minMarginRatioPercentage}%`, false);
        }
    }

    // Get all markets
    const markets = await exchange.loadMarkets();

    // Sort positions by timestamp and show the most recent N positions
    const mostRecentNPositions = positions.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, MAX_POSITIONS_IN_RESULTS);

    // Format the positions into a string
    const rows = [
        `Found ${positions.length} open positions ${positions.length > MAX_POSITIONS_IN_RESULTS ? `(showing first ${MAX_POSITIONS_IN_RESULTS})` : ''}:`,
        ...mostRecentNPositions.map((position, index) => formatPositionSingleLine(position, markets[position.symbol] as MarketInterface, `${index + 1}. `)),
    ];

    return toResult(rows.join('\n'));
}
