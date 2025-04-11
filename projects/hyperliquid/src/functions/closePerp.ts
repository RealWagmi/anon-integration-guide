import axios from 'axios';
import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { openPerp } from './openPerp';
import { hyperliquidPerps } from '../constants';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    vault?: string;
    limitPrice?: string;
}

/**
 * Closes a perpetual position on Hyperliquid by signing and submitting a typed data transaction.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param limitPrice - Price if the user wants to execute a limit order instead of a market order.
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function closePerp({ account, asset, vault, limitPrice }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = options;
    try {
        await notify('Preparing to close perpetual position...');
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
                // Close the perp by opening an opposite position (long to close short, short to close long)
                //
                const result = await openPerp(
                    {
                        account,
                        asset,
                        size: Math.abs(Number(szi)).toString(),
                        sizeUnit: 'ASSET',
                        leverage: leverage.value,
                        short: Number(szi) > 0 ? true : false,
                        closing: true,
                        vault,
                        limitPrice,
                    },
                    options,
                );
                if (!result.success) {
                    console.log('Close perp error:', result.data);
                    return toResult('Failed to close position on Hyperliquid. Please try again.', true);
                }
                return toResult(limitPrice ? 'Successfully created order' : 'Successfully closed position.');
            }
        }
        return toResult("You don't have a perp in that asset.", true);
    } catch (error) {
        console.log('Close perp error:', error);
        return toResult('Failed to close position on Hyperliquid. Please try again.', true);
    }
}
