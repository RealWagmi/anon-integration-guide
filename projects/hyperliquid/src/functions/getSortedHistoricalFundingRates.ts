import axios from 'axios';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { hyperliquidPerps, ONE_HOUR_MS, ONE_WEEK_MS, ONE_MONTH_MS, DEFAULT_FUNDING_RATE_RANGE_MS } from '../constants';

interface Props {
    timeRange?: string;
}

/**
 * Gets average historical funding rates for all supported assets over a time range, sorted from highest to lowest.
 *
 * @param timeRange - Optional time range (e.g., '1h', '8h', '1w', '1m'). Defaults to 24h if not specified.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with sorted funding rates
 */
export async function getSortedHistoricalFundingRates({ timeRange }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        const currentTime = Date.now();
        let milliseconds = DEFAULT_FUNDING_RATE_RANGE_MS; // Default to 24h

        if (timeRange) {
            const match = timeRange.match(/^(\d+)(h|w|m)$/);
            if (!match) return toResult('Invalid time range format. Use e.g., "1h", "8h", "1w", "1m".', true);

            const value = parseInt(match[1]);
            const unit = match[2];

            switch (unit) {
                case 'h':
                    milliseconds = value * ONE_HOUR_MS;
                    break;
                case 'w':
                    milliseconds = value * ONE_WEEK_MS;
                    break;
                case 'm':
                    milliseconds = value * ONE_MONTH_MS;
                    break;
                default:
                    return toResult('Unsupported time range unit', true);
            }
        }

        const startTime = currentTime - milliseconds;

        const assetsToQuery = Object.keys(hyperliquidPerps) as (keyof typeof hyperliquidPerps)[];

        console.log('Fetching funding rates for all assets over time range:', assetsToQuery);

        const fundingPromises = assetsToQuery.map(async (asset) => {
            const res = await axios.post(
                'https://api.hyperliquid.xyz/info',
                { type: 'fundingHistory', coin: asset, startTime, endTime: currentTime },
                { headers: { 'Content-Type': 'application/json' } },
            );

            const rates = res.data.map((entry: any) => parseFloat(entry.fundingRate));
            const averageRate = rates.length > 0 ? rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length : 0;

            return { asset, averageRate };
        });

        const fundingData = await Promise.all(fundingPromises);

        fundingData.sort((a, b) => b.averageRate - a.averageRate);

        const formattedRates = fundingData.map((item) => `• ${item.asset}: ${(item.averageRate * 100).toFixed(4)}%`).join('\n');

        const rangeLabel = timeRange || '24h';
        return toResult(`Average funding rates over last ${rangeLabel} (sorted highest to lowest):\n${formattedRates}`);
    } catch (error) {
        console.log('Sorted historical funding rates error:', error);
        return toResult(`Failed to fetch sorted funding rates: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
