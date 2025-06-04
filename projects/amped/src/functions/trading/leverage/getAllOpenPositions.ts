import { CONTRACT_ADDRESSES, SupportedChain } from '../../../constants.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getPosition } from './getPosition.js';
import { getTokenSymbol, type TokenSymbol as UtilTokenSymbol } from '../../../utils/tokens.js';
import { getChainFromName, getTokenAddress } from '../../../utils.js';

interface Props {
    chainName: 'sonic' | 'base';
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
        // Validate chain name exists
        if (!chainName) {
            return toResult('Chain name is required', true);
        }
        
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        const networkName = chainName.toLowerCase(); 
        if (networkName !== 'sonic' && networkName !== 'base') {
            return toResult('This function currently supports Sonic or Base chain for symbol resolution', true);
        }

        // Validate account
        if (!account || account === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid account address', true);
        }

        await options.notify('Fetching all open positions (long and short)...');

        // Define valid index tokens for positions
        const indexTokens = [];
        const indexTokenSymbols = ['WS', 'WETH', 'Anon', 'S', 'STS'];
        
        // Get addresses for all supported index tokens
        for (const symbol of indexTokenSymbols) {
            try {
                const address = getTokenAddress(symbol as any, networkName);
                indexTokens.push(address);
            } catch (e) {
                // Skip tokens that can't be resolved
            }
        }

        // Define possible collateral tokens for short positions (only stablecoins)
        // Get short collateral token addresses from SDK
        const shortCollateralTokens = [];
        try {
            shortCollateralTokens.push(getTokenAddress('USDC', networkName));
            shortCollateralTokens.push(getTokenAddress('scUSD', networkName));
        } catch (e) {
            // If tokens not found, continue with empty array
        }

        const openPositions: OpenPosition[] = [];
        let totalPositionValue = 0;
        let totalUnrealizedPnl = 0;
        let totalCollateralValue = 0;

        // If no index tokens found, return empty result
        if (indexTokens.length === 0) {
            const response: OpenPositionsResponse = {
                success: true,
                positions: [],
                totalPositionValue: '0',
                totalUnrealizedPnl: '0',
                totalCollateralValue: '0',
            };
            return toResult(JSON.stringify(response));
        }
        
        // Iterate for both isLong true (long positions) and isLong false (short positions)
        for (const isLongValue of [true, false]) {
            // Check each index token
            for (const indexToken of indexTokens) {
                const currentTokenSymbol = getTokenSymbol(indexToken, networkName);
                
                const collateralTokensToCheck = isLongValue ? [indexToken] : shortCollateralTokens;

                for (const collateralToken of collateralTokensToCheck) {
                    const currentCollateralSymbol = getTokenSymbol(collateralToken as `0x${string}`, networkName);
                    
                    // Skip if we can't resolve symbols
                    if (!currentTokenSymbol || !currentCollateralSymbol) {
                        continue;
                    }
                    
                    let positionResult;
                    try {
                        positionResult = await getPosition(
                            {
                                chainName,
                                account,
                                tokenSymbol: currentTokenSymbol as any,
                                collateralTokenSymbol: currentCollateralSymbol as any,
                                isLong: isLongValue,
                            },
                            options,
                        );
                    } catch (err) {
                        // Skip positions that throw errors
                        continue;
                    }

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
            const response: OpenPositionsResponse = {
                success: true,
                positions: [],
                totalPositionValue: '0',
                totalUnrealizedPnl: '0',
                totalCollateralValue: '0',
            };
            return toResult(JSON.stringify(response));
        }

        // Build consolidated summary message
        let summaryMessage = `Found ${openPositions.length} active position(s):\n\n`;
        
        // Add position details
        for (const [index, pos] of openPositions.entries()) {
            summaryMessage += `${index + 1}. ${pos.tokenSymbol} ${pos.isLong ? 'LONG' : 'SHORT'}\n`;
            summaryMessage += `   Collateral: ${pos.position.collateralAmount} ${pos.collateralSymbol} ($${pos.position.collateralUsd})\n`;
            summaryMessage += `   Size: $${pos.position.size} | Leverage: ${pos.position.leverage}x\n`;
            summaryMessage += `   Entry: $${pos.position.averagePrice} | Current: $${pos.position.currentPrice}\n`;
            summaryMessage += `   PnL: $${pos.position.unrealizedPnlUsd} (${pos.position.unrealizedPnlPercentage}%)\n`;
            summaryMessage += `   Liquidation: $${pos.position.liquidationPrice}\n\n`;
        }

        // Add portfolio summary
        summaryMessage += 'Portfolio Summary:\n';
        summaryMessage += `Total Position Value: $${totalPositionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        summaryMessage += `Total Unrealized PnL: $${totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        summaryMessage += `Total Collateral Value: $${totalCollateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        await options.notify(summaryMessage);

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