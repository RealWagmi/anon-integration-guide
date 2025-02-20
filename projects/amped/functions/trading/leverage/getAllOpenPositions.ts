import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getPosition } from './getPosition.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: `0x${string}`;
    isLong: boolean;
}

interface Position {
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
    leverage: string;
    liquidationPrice: string;
    lastUpdated: string | null;
}

interface OpenPosition {
    indexToken: `0x${string}`;
    collateralToken: `0x${string}`;
    isLong: boolean;
    position: Position;
    tokenSymbol: string;
    collateralSymbol: string;
}

interface OpenPositionsResponse {
    success: boolean;
    positions: OpenPosition[];
    totalPositionValue: string;
    totalUnrealizedPnl: string;
    totalCollateralValue: string;
}

function getTokenSymbol(address: `0x${string}`): string {
    const addressLower = address.toLowerCase();
    switch (addressLower) {
        case CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN.toLowerCase():
            return 'S';
        case CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH.toLowerCase():
            return 'WETH';
        case CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON.toLowerCase():
            return 'ANON';
        case CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase():
            return 'USDC';
        case CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC.toLowerCase():
            return 'EURC';
        default:
            return 'UNKNOWN';
    }
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
export async function getAllOpenPositions({ chainName, account, isLong }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Validate account
        if (!account || account === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid account address', true);
        }

        await options.notify('Checking all positions...');

        // Define valid index tokens for positions
        const indexTokens = [
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
        ] as const;

        // Define possible collateral tokens for short positions (only stablecoins)
        const shortCollateralTokens = [
            CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC
        ] as const;

        const openPositions: OpenPosition[] = [];
        let totalPositionValue = 0;
        let totalUnrealizedPnl = 0;
        let totalCollateralValue = 0;

        // Check each index token
        for (const indexToken of indexTokens) {
            const tokenSymbol = getTokenSymbol(indexToken);
            await options.notify(
                `\nChecking ${isLong ? 'long' : 'short'} positions for ${tokenSymbol}...`,
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
                    options,
                );

                if (!positionResult.success || !positionResult.data) {
                    continue;
                }

                const positionData = JSON.parse(positionResult.data);
                if (positionData.success && positionData.position && Number(positionData.position.size) > 0) {
                    const position = positionData.position as Position;
                    
                    // Add position to array with token symbols
                    openPositions.push({
                        indexToken: indexToken as `0x${string}`,
                        collateralToken: collateralToken as `0x${string}`,
                        isLong,
                        position,
                        tokenSymbol: getTokenSymbol(indexToken as `0x${string}`),
                        collateralSymbol: getTokenSymbol(collateralToken as `0x${string}`),
                    });

                    // Update totals with safe numeric conversion
                    totalPositionValue += Number(position.size);
                    totalUnrealizedPnl += Number(position.unrealizedPnlUsd);
                    totalCollateralValue += Number(position.collateralUsd);
                }
            }
        }

        if (openPositions.length === 0) {
            await options.notify(`\nNo active ${isLong ? 'long' : 'short'} positions found`);
            const response: OpenPositionsResponse = {
                success: true,
                positions: [],
                totalPositionValue: '0',
                totalUnrealizedPnl: '0',
                totalCollateralValue: '0',
            };
            return toResult(JSON.stringify(response));
        }

        await options.notify(`\nFound ${openPositions.length} active ${isLong ? 'long' : 'short'} position(s):`);
        
        // Log position summaries
        for (const [index, pos] of openPositions.entries()) {
            await options.notify(`\n${index + 1}. Position Details:`);
            await options.notify(`Index Token: ${pos.tokenSymbol}`);
            await options.notify(`Collateral Token: ${pos.collateralSymbol}`);
            await options.notify(`Size: ${pos.position.size} USD`);
            await options.notify(`Collateral: ${pos.position.collateral} ${pos.collateralSymbol} (${pos.position.collateralUsd} USD)`);
            await options.notify(`Entry Price: ${pos.position.averagePrice} USD`);
            await options.notify(`Current Price: ${pos.position.currentPrice} USD`);
            await options.notify(`Leverage: ${pos.position.leverage}x`);
            await options.notify(`Liquidation Price: ${pos.position.liquidationPrice} USD`);
            await options.notify(`Unrealized PnL: ${pos.position.unrealizedPnlUsd} USD (${pos.position.unrealizedPnlPercentage}%)`);
        }

        // Log portfolio summary
        await options.notify('\nPortfolio Summary:');
        await options.notify(`Total Position Value: $${totalPositionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        await options.notify(`Total Unrealized PnL: $${totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        await options.notify(`Total Collateral Value: $${totalCollateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        const response: OpenPositionsResponse = {
            success: true,
            positions: openPositions,
            totalPositionValue: totalPositionValue.toString(),
            totalUnrealizedPnl: totalUnrealizedPnl.toString(),
            totalCollateralValue: totalCollateralValue.toString(),
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get all positions: ${error.message}`, true);
        }
        return toResult('Failed to get all positions: Unknown error', true);
    }
} 