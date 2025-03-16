import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';

interface Props {
    account: Address;
}

/**
 * Gets the user's available balance (withdrawable amount) in their Hyperliquid perpetual account.
 *
 * @param account - User's wallet address
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with available perpetual balance
 */
export async function getPerpBalances({ account }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        console.log('Getting perpetual balance for account:', account);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
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
