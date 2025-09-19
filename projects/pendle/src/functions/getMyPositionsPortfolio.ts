import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { PendleClient } from '../helpers/client';
import { flattenAndSortPositions, formatFlattenedPositions } from '../helpers/positions';
import { MAX_POSITIONS_IN_RESULTS } from '../constants';

interface Props {}

export async function getMyPositionsPortfolio(_props: Props, { notify, evm: { getAddress } }: FunctionOptions): Promise<FunctionReturn> {
    // Get positions
    await notify('Checking portfolio...');
    const pendleClient = new PendleClient();
    const positionsForAllChains = await pendleClient.getAddressPositions(await getAddress());
    if (!positionsForAllChains || positionsForAllChains.length === 0) {
        return toResult('No positions found in your portfolio');
    }

    // Flatten and sort all positions by valuation
    const flattenedResult = await flattenAndSortPositions(positionsForAllChains);

    // Format the flattened positions for display
    const firstNPositions = flattenedResult.positions.slice(0, MAX_POSITIONS_IN_RESULTS);
    const formattedOutput = formatFlattenedPositions(firstNPositions, ' - ');

    // Initial summary
    const parts = [
        `Found ${flattenedResult.totalPositions} positions in your portfolio, worth a total of $${flattenedResult.totalValuation.toFixed(2)}`,
        firstNPositions.length !== flattenedResult.totalPositions ? `Showing the top ${MAX_POSITIONS_IN_RESULTS} positions by value:` : '',
        formattedOutput,
    ];

    // Return the result
    return toResult(parts.filter(Boolean).join('\n'));
}
