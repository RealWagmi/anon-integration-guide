import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';
import { FunctionOptions, FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { getPosition } from './getPositions';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: `0x${string}`;
    isLong: boolean;
}

interface OpenPosition {
    indexToken: `0x${string}`;
    collateralToken: `0x${string}`;
    isLong: boolean;
    position: {
        size: string;
        collateral: string;
        collateralUsd: string;
        averagePrice: string;
        currentPrice: string;
        entryFundingRate: string;
        hasProfit: boolean;
        realizedPnl: string;
        unrealizedPnlUsd: string;
        unrealizedPnlPercentage: string;
        lastUpdated: Date | null;
    };
}

/**
 * Gets all open perpetual trading positions for an account
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check positions for
 * @param props.isLong - Whether to check long positions (false for short positions)
 * @param options - System tools for blockchain interactions
 * @returns Array of all open positions with their details
 */
export async function getAllOpenPositions({ chainName, account, isLong }: Props, { getProvider, notify, sendTransactions }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        await notify('Checking all positions...');

        // Define valid index tokens for positions
        const indexTokens = [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON] as const;

        // Define possible collateral tokens for short positions (only stablecoins)
        const shortCollateralTokens = [CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC] as const;

        const openPositions: OpenPosition[] = [];

        // Check each index token
        for (const indexToken of indexTokens) {
            await notify(
                `\nChecking ${isLong ? 'long' : 'short'} positions for ${
                    indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN ? 'S' : indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH ? 'WETH' : 'ANON'
                }...`,
            );

            // For long positions, only check when collateral matches index token
            // For short positions, check USDC and EURC as collateral
            const collateralTokensToCheck = isLong ? [indexToken] : shortCollateralTokens;

            for (const collateralToken of collateralTokensToCheck) {
                const positionResult = await getPosition(
                    {
                        chainName,
                        account,
                        indexToken: indexToken as `0x${string}`,
                        collateralToken: collateralToken as `0x${string}`,
                        isLong,
                    },
                    { getProvider, notify, sendTransactions },
                );

                const positionData = JSON.parse(positionResult.data);
                if (positionData.success && positionData.position && positionData.position.size !== '0.0') {
                    openPositions.push({
                        indexToken: indexToken as `0x${string}`,
                        collateralToken: collateralToken as `0x${string}`,
                        isLong,
                        position: positionData.position,
                    });
                }
            }
        }

        if (openPositions.length === 0) {
            await notify(`\nNo active ${isLong ? 'long' : 'short'} positions found`);
            return toResult(JSON.stringify({ success: true, positions: [] }));
        }

        await notify(`\nFound ${openPositions.length} active ${isLong ? 'long' : 'short'} position(s):`);
        openPositions.forEach((pos, index) => {
            notify(`\n${index + 1}. Position Details:`);
            notify(
                `Index Token: ${
                    pos.indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN ? 'S' : pos.indexToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH ? 'WETH' : 'ANON'
                }`,
            );
            notify(
                `Collateral Token: ${
                    pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN
                        ? 'S'
                        : pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC
                          ? 'USDC'
                          : 'ANON'
                }`,
            );
            notify(`Size: ${pos.position.size} USD`);
            notify(
                `Collateral: ${pos.position.collateral} ${
                    pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN
                        ? 'S'
                        : pos.collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC
                          ? 'USDC'
                          : 'ANON'
                } (${pos.position.collateralUsd} USD)`,
            );
            notify(`Entry Price: ${pos.position.averagePrice} USD`);
            notify(`Current Price: ${pos.position.currentPrice} USD`);
            notify(`Unrealized PnL: ${pos.position.unrealizedPnlUsd} USD (${pos.position.unrealizedPnlPercentage}%)`);
        });

        return toResult(
            JSON.stringify({
                success: true,
                positions: openPositions,
            }),
        );
    } catch (error) {
        console.error('Error getting all positions:', error);
        return toResult(
            error instanceof Error ? `Failed to get all positions: ${error.message}` : 'Failed to get all positions. Please check your parameters and try again.',
            true,
        );
    }
} 