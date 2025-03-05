import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';

interface Props {
    account: Address;
    asset: 'ETH' | 'BTC' | 'HYPE' | 'PURR' | 'LINK' | 'ARB';
}

/**
 * Closes a perpetual position on Hyperliquid by signing and submitting a typed data transaction.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function closePerp({ account, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = options;
    try {
        //
        // Firstly, check if user has the position in that asset
        //
        const resultClearingHouseState = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const { assetPositions } = resultClearingHouseState.data;

        for (const { position } of assetPositions) {
            const { coin, szi, leverage } = position;
            if (coin == asset) {
                //
                // Close the perp by opening an opposite position (long to close short, short to close long)
                //
                const result = await openPerp(
                    { account, asset, size: Math.abs(Number(szi)).toString(), sizeUnit: 'ASSET', leverage: leverage.value, short: Number(szi) > 0 ? true : false, closing: true },
                    options,
                );
                if (!result.success) {
                    console.log('Close perp error:', result.data);
                    return toResult('Failed to close position on Hyperliquid. Please try again.', true);
                }
                return toResult('Successfully closed position.');
            }
        }
        return toResult("You don't have a perp in that asset.", true);
    } catch (error) {
        console.log('Close perp error:', error);
        return toResult('Failed to close position on Hyperliquid. Please try again.', true);
    }
}
