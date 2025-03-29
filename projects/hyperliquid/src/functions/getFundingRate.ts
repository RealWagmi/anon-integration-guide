import axios from 'axios';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { hyperliquidPerps } from '../constants';

interface Props {
    asset: keyof typeof hyperliquidPerps;
}

/**
 * Gets the current funding rate for a specific asset.
 *
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with the current funding rate
 */
export async function getFundingRate({ asset }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (!hyperliquidPerps[asset]) {
            return toResult(`Invalid asset specified: ${asset}`, true);
        }

        console.log('Fetching current funding rate for asset:', asset);

        const res = await axios.post('https://api.hyperliquid.xyz/info', { type: 'metaAndAssetCtxs' }, { headers: { 'Content-Type': 'application/json' } });

        const universe = res.data[0].universe;
        const assetCtxs = res.data[1];
        const assetIndex = universe.findIndex((item: any) => item.name === asset);

        if (assetIndex === -1) {
            return toResult(`Asset ${asset} not found in Hyperliquid data`, true);
        }

        const currentRate = parseFloat(assetCtxs[assetIndex].funding);
        const formattedRate = `${asset}: ${(currentRate * 100).toFixed(4)}%`;

        return toResult(`Current funding rate:\n• ${formattedRate}`);
    } catch (error) {
        console.log('Current funding rate error:', error);
        return toResult(`Failed to fetch current funding rate: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
