import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';

interface Props {
    account: Address;
    asset: 'ETH' | 'BTC' | 'HYPE' | 'PURR' | 'LINK' | 'ARB';
    size: string;
}

/**
 * Increases or decreases the perp position size by specified amount of USD.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - The amount of USD to modify the position for. Positive for increasing size and negative for decreasing size. 
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function modifyPerpPositionByUSD({ account, asset, size }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
                // Update the position
                //

                const result = await openPerp(
                    { account, asset, size, sizeUnit: 'USD', leverage: leverage.value, short: Number(szi) > 0 ? false : true, updating: true },
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
