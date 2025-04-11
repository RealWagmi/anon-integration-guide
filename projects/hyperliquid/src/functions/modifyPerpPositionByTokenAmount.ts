import axios from 'axios';
import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';
import { hyperliquidPerps } from '../constants';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    size: string;
    limitPrice?: string;
    vault?: string;
}

/**
 * Increases or decreases the perp position size by specified amount of USD.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - The amount of asset token to modify the position for. Positive for increasing size and negative for decreasing size.
 * @param limitPrice - Price if the user wants to execute a limit order instead of a market order.
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function modifyPerpPositionByTokenAmount({ account, asset, size, limitPrice, vault }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = options;
    try {
        await notify('Preparing to modify perpetual position...');
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

                const result = await openPerp(
                    { account, asset, size, sizeUnit: 'ASSET', leverage: leverage.value, short: Number(szi) > 0 ? false : true, updating: true, vault, limitPrice },
                    options,
                );
                if (!result.success) {
                    return toResult('Failed to modify position on Hyperliquid. ', true);
                }
                return toResult(limitPrice ? 'Successfully created order' : 'Successfully modified position.');
            }
        }
        return toResult("You don't have a perp in that asset.", true);
    } catch (error) {
        return toResult('Failed to modify position on Hyperliquid. Please try again.', true);
    }
}
