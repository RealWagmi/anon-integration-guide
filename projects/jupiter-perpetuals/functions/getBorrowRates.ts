import { FunctionReturn, toResult } from '@heyanon/sdk';
import { TOKEN_MINTS, AssetType } from '../types';
import { PerpsApiService } from '../services/perpsApi';

interface Props {
    asset: AssetType;
}

/**
 * Fetches current borrow rates and market information for Jupiter Perpetuals markets
 *
 * @param {Object} params - The input parameters
 * @param {AssetType} params.asset - The asset to query (SOL, ETH, BTC)
 *
 * @returns {Promise<FunctionReturn>} A structured response containing:
 * @returns {string} data.asset - The queried asset symbol
 * @returns {Object} data.long - Long position information
 * @returns {string} data.long.borrowRate - Current borrow rate for long positions (in %)
 * @returns {string} data.long.utilization - Current utilization rate for long positions (in %)
 * @returns {string} data.long.availableLiquidity - Available liquidity for long positions
 * @returns {Object} data.short - Short position information
 * @returns {string} data.short.borrowRate - Current borrow rate for short positions (in %)
 * @returns {string} data.short.utilization - Current utilization rate for short positions (in %)
 * @returns {string} data.short.availableLiquidity - Available liquidity for short positions
 * @returns {string} data.openFee - Fee for opening positions (in %)
 * @returns {number} data.timestamp - Unix timestamp of the rate data
 *
 * @example
 * const result = await getBorrowRates({ asset: 'SOL' });
 * if (result.success) {
 *     const data = JSON.parse(result.data);
 *     console.log(`Long borrow rate: ${data.long.borrowRate}%`);
 *     console.log(`Short borrow rate: ${data.short.borrowRate}%`);
 * }
 */

export async function getBorrowRates({ asset }: Props): Promise<FunctionReturn> {
    try {
        // Check for valid asset first
        if (!TOKEN_MINTS[asset]) {
            // error = true -> success = false, and prepends "ERROR: "
            return toResult(`Invalid asset: ${asset}. Must be one of: ${Object.keys(TOKEN_MINTS).join(', ')}`, true);
        }

        // Get and transform the data
        const poolInfo = await PerpsApiService.getPoolInfo(TOKEN_MINTS[asset]);
        const marketData = PerpsApiService.transformToMarketData(poolInfo);

        const response = {
            asset,
            ...marketData,
        };

        return toResult(JSON.stringify(response));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Error fetching borrow rates: ${errorMessage}`, true);
    }
}
