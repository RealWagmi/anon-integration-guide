import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { hyperliquidPerps } from '../constants';

interface Props {
    account: Address;
}

/**
 * Gets the user's spot balances on Hyperliquid.
 *
 * @param account - User's wallet address
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with spot balances
 */
export async function getSpotBalances({ account }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        console.log('Getting spot balance for account:', account);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'spotClearinghouseState', user: account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res.data;

        if (!data.balances || !Array.isArray(data.balances)) {
            return toResult('No spot balances found or invalid response format', true);
        }

        const nonZeroBalances = data.balances.filter((balance: any) => parseFloat(balance.total) > 0);
        const supportedAssets = Object.keys(hyperliquidPerps);
        const supportedBalances = nonZeroBalances.filter((balance: any) => balance.coin === 'USDC' || supportedAssets.includes(balance.coin));

        if (supportedBalances.length === 0) {
            return toResult('No supported assets found in your Hyperliquid spot account');
        }

        // Format the balance information
        const formattedBalances = supportedBalances.map((balance: any) => `${balance.coin}: ${balance.total}`).join('\n');

        return toResult(`Spot balances on Hyperliquid:\n${formattedBalances}`);
    } catch (error) {
        console.log('Spot balance error:', error);
        return toResult(`Failed to fetch spot balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
