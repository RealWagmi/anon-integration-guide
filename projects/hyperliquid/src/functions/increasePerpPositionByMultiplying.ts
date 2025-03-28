import axios from 'axios';
import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';
import { hyperliquidPerps } from '../constants';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    sizeMultiplier: string;
    vault?: string;
}

/**
 * Increases the perp position size by specified percentage.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - Percentage as decimal number >1
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function increasePerpPositionByMultiplying({ account, asset, sizeMultiplier, vault }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = options;
    try {
        await notify('Preparing to increase perpetual position...');
        if (parseFloat(sizeMultiplier) <= 1) return toResult('Position needs to be larger when you increase it.', true);

        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        //
        // Firstly, check if user has the position in that asset
        //
        const resultClearingHouseState = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: vault || account },
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

                const sz = Number(szi) * (Number(sizeMultiplier) - 1);

                // We want the size to be positive when we are increasing the position, so the checks in openPerp work as expected
                // If your position is short, you are going to short the positive value (resulting in short)
                // If your position is long, you are going to long the positive value (resulting in long)
                const result = await openPerp(
                    {
                        account,
                        asset,
                        size: Math.abs(sz).toString(),
                        sizeUnit: 'ASSET',
                        leverage: leverage.value,
                        short: sz < 0, // Because szi is negative for shorts
                        updating: true,
                        vault,
                    },
                    options,
                );
                if (!result.success) {
                    notify(result.data);
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
