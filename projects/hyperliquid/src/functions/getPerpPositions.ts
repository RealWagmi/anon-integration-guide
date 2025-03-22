import axios from 'axios';
import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    vault?: string;
}

/**
 * Gets the user's perpetual positions on Hyperliquid.
 *
 * @param account - User's wallet address
 * @param vault - Add this if you want to do this for the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function getPerpPositions({ account, vault }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        console.log('Getting perpetual positions for account:', account);

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

        if (!data.assetPositions || !Array.isArray(data.assetPositions)) {
            return toResult('No perpetual positions found or invalid response format', true);
        }

        // Format account summary data
        const accountValue = Number(data.marginSummary.accountValue).toFixed(2);
        const withdrawable = Number(data.withdrawable).toFixed(2);

        if (data.assetPositions.length === 0) {
            return toResult(`No open positions on Hyperliquid.\n\n📊 Account Summary:\n• Account Value: $${accountValue}\n• Withdrawable: $${withdrawable}`);
        }

        const formattedPositions = data.assetPositions
            .map((assetPosition: any, index: number) => {
                const { position } = assetPosition;
                const direction = Number(position.szi) > 0 ? 'LONG' : 'SHORT';
                const size = Math.abs(Number(position.szi));
                const entryPrice = Number(position.entryPx).toFixed(2);
                const positionValue = Number(position.positionValue).toFixed(2);
                const leverage = position.leverage.value;
                const pnl = Number(position.unrealizedPnl).toFixed(2);
                const liquidationPrice = Number(position.liquidationPx).toFixed(2);

                return (
                    `📈 Position #${index + 1}: ${direction} ${position.coin} (${leverage}x)\n` +
                    `• Size: ${size}\n` +
                    `• Entry Price: $${entryPrice}\n` +
                    `• Liquidation Price: $${liquidationPrice}\n` +
                    `• Position Value: $${positionValue}\n` +
                    `• Unrealized PnL: $${pnl}`
                );
            })
            .join('\n\n');

        const response =
            `=== HYPERLIQUID PERPETUAL POSITIONS ===\n\n` +
            `${formattedPositions}\n\n` +
            `📊 ACCOUNT SUMMARY\n` +
            `• Account Value: $${accountValue}\n` +
            `• Withdrawable: $${withdrawable}`;

        return toResult(response);
    } catch (error) {
        console.log('Perp positions error:', error);
        return toResult(`Failed to fetch perpetual positions: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
