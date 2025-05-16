import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getPosition } from './getPosition.js';
import { getTokenSymbol, type TokenSymbol as UtilTokenSymbol } from '../../../utils/tokens.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: `0x${string}`;
}

// This interface should match the structure of `position` object returned by `getPosition`
interface PositionFromGetPosition {
    size: string; 
    collateralAmount: string; // Amount of collateral token
    collateralUsd: string; // USD value of collateral
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
    position: PositionFromGetPosition;
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

/**
 * Gets all open perpetual trading positions (long and short) for an account
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check positions for
 * @param options - System tools for blockchain interactions
 * @returns Array of all open positions with their details
 */
export async function getAllOpenPositions({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        const networkName = chainName.toLowerCase(); 
        if (networkName !== NETWORKS.SONIC && networkName !== NETWORKS.BASE) {
            return toResult('This function currently supports Sonic or Base chain for symbol resolution', true);
        }

        // Validate account
        if (!account || account === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid account address', true);
        }

        await options.notify('Checking all positions (long and short)...');

        // Define valid index tokens for positions
        const indexTokens = [
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].STS
        ] as const;

        // Define possible collateral tokens for short positions (only stablecoins)
        const shortCollateralTokens = [
            CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].SCUSD
        ] as const;

        const openPositions: OpenPosition[] = [];
        let totalPositionValue = 0;
        let totalUnrealizedPnl = 0;
        let totalCollateralValue = 0;

        // Iterate for both isLong true (long positions) and isLong false (short positions)
        for (const isLongValue of [true, false]) {
            await options.notify(
                `\n--- Checking ${isLongValue ? 'LONG' : 'SHORT'} positions ---`,
            );
            // Check each index token
            for (const indexToken of indexTokens) {
                const currentTokenSymbol = getTokenSymbol(indexToken, networkName) || 'UNKNOWN_INDEX';
                
                const collateralTokensToCheck = isLongValue ? [indexToken] : shortCollateralTokens;

                for (const collateralToken of collateralTokensToCheck) {
                    const currentCollateralSymbol = getTokenSymbol(collateralToken as `0x${string}`, networkName) || 'UNKNOWN_COLLATERAL';
                    await options.notify(
                        `Checking ${currentTokenSymbol}/${currentCollateralSymbol} (${isLongValue ? 'long' : 'short'})`
                    );
                    const positionResult = await getPosition(
                        {
                            chainName,
                            account,
                            indexToken: indexToken as `0x${string}`,
                            collateralToken: collateralToken as `0x${string}`,
                            isLong: isLongValue, // Pass the current isLongValue
                        },
                        options,
                    );

                    if (!positionResult.success || !positionResult.data) {
                        continue;
                    }

                    const positionData = JSON.parse(positionResult.data);
                    if (positionData.success && positionData.position && Number(positionData.position.size) > 0) {
                        const position = positionData.position as PositionFromGetPosition;
                        
                        openPositions.push({
                            indexToken: indexToken as `0x${string}`,
                            collateralToken: collateralToken as `0x${string}`,
                            isLong: isLongValue, // Store whether it was a long or short position
                            position,
                            tokenSymbol: currentTokenSymbol,
                            collateralSymbol: currentCollateralSymbol,
                        });

                        totalPositionValue += Number(position.size);
                        totalUnrealizedPnl += Number(position.unrealizedPnlUsd);
                        totalCollateralValue += Number(position.collateralUsd);
                    }
                }
            }
        }

        if (openPositions.length === 0) {
            await options.notify(`\nNo active long or short positions found`);
            const response: OpenPositionsResponse = {
                success: true,
                positions: [],
                totalPositionValue: '0',
                totalUnrealizedPnl: '0',
                totalCollateralValue: '0',
            };
            return toResult(JSON.stringify(response));
        }

        await options.notify(`\nFound ${openPositions.length} active position(s) in total (long and short):`);
        
        // Log position summaries
        for (const [index, pos] of openPositions.entries()) {
            await options.notify(`\n${index + 1}. Position Details (${pos.isLong ? 'LONG' : 'SHORT'}):`);
            await options.notify(`Index Token: ${pos.tokenSymbol}`);
            await options.notify(`Collateral Token: ${pos.collateralSymbol}`);
            await options.notify(`Size: ${pos.position.size} USD`);
            // Use pos.position.collateralAmount for the token quantity
            await options.notify(`Collateral: ${pos.position.collateralAmount} ${pos.collateralSymbol} (${pos.position.collateralUsd} USD)`);
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