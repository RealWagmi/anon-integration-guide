import axios from 'axios';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { hyperliquidPerps, ONE_HOUR_MS, ONE_WEEK_MS, ONE_MONTH_MS, DEFAULT_FUNDING_RATE_RANGE_MS } from '../constants';

interface Props {
    asset: keyof typeof hyperliquidPerps;
    timeRange?: string;
}

/**
 * Gets historical funding rates for a specific asset over a time range.
 *
 * @param asset - Asset symbol from hyperliquidPerps (e.g., 'BTC')
 * @param timeRange - Optional time range (e.g., '1h', '8h', '1w', '1m'). Defaults to 24h if not specified.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with historical funding rates
 */
export async function getHistoricalFundingRates({ asset, timeRange }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
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

        if (!hyperliquidPerps[asset]) {
            return toResult(`Invalid asset specified: ${asset}`, true);
        }

        console.log('Fetching historical funding rates for asset:', asset);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'fundingHistory', coin: asset, startTime, endTime: currentTime },
            { headers: { 'Content-Type': 'application/json' } },
        );

        const rates = res.data.map((entry: any) => ({
            rate: parseFloat(entry.fundingRate),
            time: entry.time,
        }));

        if (rates.length === 0) {
            const rangeLabel = timeRange || '24h';
            return toResult(`No funding rate history found for ${asset} in the last ${rangeLabel}`, true);
        }

        const formattedRates = rates.map((item: any) => `• ${(item.rate * 100).toFixed(4)}% at ${new Date(item.time).toUTCString()}`).join('\n');

        const rangeLabel = timeRange || '24h';
        return toResult(`Historical funding rates for ${asset} over last ${rangeLabel}:\n${formattedRates}`);
    } catch (error) {
        console.log('Historical funding rates error:', error);
        return toResult(`Failed to fetch historical funding rates: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
