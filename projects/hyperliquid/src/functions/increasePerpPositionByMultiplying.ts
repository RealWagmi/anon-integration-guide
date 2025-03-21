import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';

interface Props {
    account: Address;
    asset: 'ETH' | 'BTC' | 'HYPE' | 'PURR' | 'LINK' | 'ARB';
    sizeMultiplier: string;
}

/**
 * Increases the perp position size by specified percentage.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - Percentage as decimal number >1
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function increasePerpPositionByMultiplying({ account, asset, sizeMultiplier }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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

        if (parseFloat(sizeMultiplier) <= 1) return toResult('Position needs to be larger when you increase it.', true);

        for (const { position } of assetPositions) {
            const { coin, szi, leverage } = position;
            if (coin == asset) {
                //
                // Update the position
                //

                const result = await openPerp(
                    {
                        account,
                        asset,
                        size: (Number(szi) * (Number(sizeMultiplier) - 1)).toString(),
                        sizeUnit: 'ASSET',
                        leverage: leverage.value,
                        short: false, // Because szi is negative for shorts
                        updating: true,
                    },
                    options,
                );
                if (!result.success) {
                    return toResult('Failed to modify position on Hyperliquid. ', true);
                }
                return toResult('Successfully modified position.');
            }
        }
        return toResult("You don't have a perp in that asset.", true);
    } catch (error) {
        return toResult('Failed to modify position on Hyperliquid. Please try again.', true);
    }
}
