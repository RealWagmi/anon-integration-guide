import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { MAX_POSITIONS_IN_RESULTS } from '../constants';
import { formatPositionSingleLine } from '../helpers/format';
import { MarketInterface, Position } from 'ccxt';
import { getUserOpenPositions } from '../helpers/positions';
import { getAccountMarginMode, SETTLE_CURRENCIES, SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL } from '../helpers/exchange';

interface Props {}

/**
 * Get a list of the user's open positions, sorted in descending order of timestamp.
 *
 * @param {Object} props - The function input parameters
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A string with the list of open positions, including: position ID, notional, PNL, timestamp, etc.
 */
export async function getPositions({}: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Get all open positions
        const positions: Position[] = [];
        for (const settle of SETTLE_CURRENCIES) {
            const positionsForSettle = await getUserOpenPositions(exchange, { settleCoin: settle });
            positions.push(...positionsForSettle);
        }
        if (positions.length === 0) {
            return toResult('No open positions found'); // not an error, just a message
        }

        // Fetch margin mode at the account level, if needed
        try {
            if (positions.some((p) => typeof p.marginMode === 'undefined' && !SUPPORTS_SETTING_MARGIN_MODE_AT_MARKET_LEVEL)) {
                const marginMode = await getAccountMarginMode(exchange);
                if (marginMode) {
                    positions.forEach((position) => {
                        if (typeof position.marginMode === 'undefined') {
                            position.marginMode = marginMode;
                        }
                    });
                }
            }
        } catch (error) {
            notify(`Could not fetch margin mode for the account, margin metrics might be inaccurate`);
        }

        // Get all markets
        const markets = await exchange.loadMarkets();

        // Sort positions by timestamp and show the most recent N positions
        const mostRecentNPositions = positions.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, MAX_POSITIONS_IN_RESULTS);

        // Format the positions into a string
        const rows = [
            `Found ${positions.length} open position${positions.length > 1 ? 's' : ''}${positions.length > MAX_POSITIONS_IN_RESULTS ? ` (showing first ${MAX_POSITIONS_IN_RESULTS})` : ''}:`,
            ...mostRecentNPositions.map((position, index) => formatPositionSingleLine(position, markets[position.symbol] as MarketInterface, `${index + 1}. `)),
        ];

        return toResult(rows.join('\n'));
    } catch (error) {
        return toResult(`Error getting positions: ${error}`, true);
    }
}
