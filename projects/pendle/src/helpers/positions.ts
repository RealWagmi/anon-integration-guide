import { getChainNameFromChainId } from './chains';
import { MarketCompactData, ChainPositions, PendleClient, MarketPosition } from './client';

/**
 * Represents a single token position (PT, YT, or LP) with its context
 */
export type FlattenedTokenPosition = {
    /** Chain ID where the position exists */
    chainId: number;
    /** Market ID (format: chainId-marketAddress) */
    marketId: string;
    /** Token type: PT, YT, or LP */
    tokenType: 'PT' | 'YT' | 'LP';
    /** Position type: open or closed */
    positionType: 'open' | 'closed';
    /** Valuation in USD */
    valuation: number;
    /** Token balance */
    balance: string;
    /** Active balance (for LP tokens) */
    activeBalance?: string;
    /** Claimable token amounts */
    claimTokenAmounts?: Array<{ token: string; amount: string }>;
    /** Chain name */
    chainName: string;
    /** Market name */
    marketName?: string;
    /** Market expiry date */
    marketExpiry?: string;
    /** Full market details (optional) */
    market?: MarketCompactData;
};

/**
 * Result of flattening and sorting positions
 */
export type FlattenedPositionsResult = {
    /** Array of individual token positions sorted by valuation */
    positions: FlattenedTokenPosition[];
    /** Total valuation across all positions */
    totalValuation: number;
    /** Total number of non-zero positions */
    totalPositions: number;
};

/**
 * Flattens a ChainPositions[] array into individual PT, YT, and LP positions
 * and sorts them by valuation in descending order
 *
 * @param chainPositions - The chain positions array to flatten
 * @param includeZeroPositions - Whether to include positions with zero valuation (default: false)
 * @param includeClosedPositions - Whether to include closed positions (default: true)
 * @returns Object containing flattened positions sorted by valuation, total valuation, and position count
 */
export async function flattenAndSortPositions(
    chainPositions: ChainPositions[],
    includeZeroPositions: boolean = false,
    includeClosedPositions: boolean = true,
): Promise<FlattenedPositionsResult> {
    const flattenedPositions: FlattenedTokenPosition[] = [];
    let totalValuation = 0;
    const pendleClient = new PendleClient();

    // Helper function to process a single market position
    const processMarketPosition = (
        market: MarketPosition,
        chain: ChainPositions,
        chainName: string,
        positionType: 'open' | 'closed',
        marketDetails: Map<string, MarketCompactData>,
    ) => {
        // Get market details
        const marketAddress = market.marketId.split('-')[1];
        const marketData = marketDetails.get(marketAddress);

        // Process each token type (PT, YT, LP)
        const tokenTypes: Array<'pt' | 'yt' | 'lp'> = ['pt', 'yt', 'lp'];

        for (const tokenKey of tokenTypes) {
            const token = market[tokenKey];
            if (token && (includeZeroPositions || token.valuation > 0)) {
                flattenedPositions.push({
                    chainId: chain.chainId,
                    chainName,
                    marketId: market.marketId,
                    tokenType: tokenKey.toUpperCase() as 'PT' | 'YT' | 'LP',
                    positionType,
                    valuation: token.valuation || 0,
                    balance: token.balance,
                    activeBalance: token.activeBalance,
                    claimTokenAmounts: token.claimTokenAmounts,
                    marketName: marketData?.name,
                    marketExpiry: marketData?.expiry,
                    market: marketData,
                });

                if (token.valuation > 0) {
                    totalValuation += token.valuation;
                }
            }
        }
    };

    // Iterate through all chains
    for (const chain of chainPositions) {
        const chainName = getChainNameFromChainId(chain.chainId);

        // Fetch market details for this chain (memoized in the client)
        const markets = await pendleClient.getActiveMarkets(chain.chainId);
        const marketDetailsMap = new Map<string, MarketCompactData>();
        markets.forEach((m) => marketDetailsMap.set(m.address, m));

        // Process open positions
        if (chain.openPositions) {
            for (const market of chain.openPositions) {
                processMarketPosition(market, chain, chainName, 'open', marketDetailsMap);
            }
        }

        // Process closed positions if requested
        if (includeClosedPositions && chain.closedPositions) {
            for (const market of chain.closedPositions) {
                processMarketPosition(market, chain, chainName, 'closed', marketDetailsMap);
            }
        }
    }

    // Sort by valuation in descending order
    flattenedPositions.sort((a, b) => b.valuation - a.valuation);

    // Count non-zero positions
    const totalPositions = flattenedPositions.filter((p) => p.valuation > 0).length;

    return {
        positions: flattenedPositions,
        totalValuation,
        totalPositions,
    };
}

/**
 * Formats flattened positions into a compact string representation
 * Each position is shown on a separate line with its details
 *
 * @param flattenedResult - The result from flattenAndSortPositions
 * @param linePrefix - Prefix to add to each line (default: '')
 * @returns Formatted string representation of positions
 */
export function formatFlattenedPositions(flattenedPositions: FlattenedTokenPosition[], linePrefix: string = ''): string {
    const formattedParts: string[] = [];

    for (const position of flattenedPositions) {
        // Skip zero-value positions unless they were explicitly included
        if (position.valuation === 0) {
            continue;
        }

        let parts: string[] = [
            `${position.tokenType} position`,
            position.marketName ? `in ${position.marketName}` : '',
            `on ${position.chainName} chain`,
            `worth $${position.valuation.toFixed(2)}`,
            `(${position.positionType})`,
        ].filter(Boolean); // Remove empty strings

        // Add expiry if available
        if (position.marketExpiry) {
            parts.push(`expires ${position.marketExpiry}`);
        }

        // Add claimable yield indicator
        if (position.claimTokenAmounts && position.claimTokenAmounts.length > 0) {
            parts.push(`(has claimable yield)`);
        }

        formattedParts.push(parts.join(' '));
    }
    return formattedParts.join('\n').replace(/^/gm, linePrefix);
}
