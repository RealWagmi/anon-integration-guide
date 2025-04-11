import axios from 'axios';
import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { _getVaultAddress } from './utils/_getVaultAddress';

interface Props {
    account: Address;
    vault?: string;
}

/**
 * Gets the user's available balance (withdrawable amount) in their Hyperliquid perpetual account.
 *
 * @param account - User's wallet address
 * @param vault - Add this if you want to do this for the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with available perpetual balance
 */
export async function getPerpBalances({ account, vault }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getVaultAddress(vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        console.log('Getting perpetual balance for account:', vault || account);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: vault || account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res.data;

        if (!data || typeof data.withdrawable === 'undefined') {
            return toResult('No perpetual balance found or invalid response format', true);
        }

        // Format the withdrawable amount
        const withdrawable = Number(data.withdrawable).toFixed(2);

        return toResult(`Perp balance on Hyperliquid:\n• Available: $${withdrawable}`);
    } catch (error) {
        console.log('Perp balance error:', error);
        return toResult(`Failed to fetch perpetual balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
