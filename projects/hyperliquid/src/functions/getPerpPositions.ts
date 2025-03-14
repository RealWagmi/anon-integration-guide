import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';

interface Props {
    account: Address;
}

/**
 * Gets the user's perpetual positions on Hyperliquid.
 *
 * @param account - User's wallet address
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function getPerpPositions({ account }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        console.log('Getting perpetual positions for account:', account);

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

        if (!data.assetPositions || !Array.isArray(data.assetPositions)) {
            return toResult('No perpetual positions found or invalid response format', true);
        }

        // Format account summary data
        const accountValue = Number(data.marginSummary.accountValue).toFixed(2);
        const withdrawable = Number(data.withdrawable).toFixed(2);

        if (data.assetPositions.length === 0) {
            return toResult(`No open positions on Hyperliquid.\n\n📊 Account Summary:\n• Account Value: $${accountValue}\n• Withdrawable: $${withdrawable}`);
        }

        // Format each position with better structure
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

        // Create a more structured overall response
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
