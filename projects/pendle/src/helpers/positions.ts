import { getChainNameFromChainId } from './chains';
import { MarketCompactData, ChainPositions, PendleClient } from './client';

/**
 * Format a list of positions from the API in a compact format;
 * it does fetch the active markets for each chain, so it's not
 * a proper formatting function ;-)
 *
 * Each PT, YT and LP is shown on a separate line.
 *
 * Original format:
 * [
 *     {
 *         "chainId": 999,
 *         "totalOpen": 1,
 *         "totalClosed": 0,
 *         "totalSy": 0,
 *         "openPositions": [
 *             {
 *                 "marketId": "999-0x8867d2b7adb8609c51810237ecc9a25a2f601b97",
 *                 "pt": {
 *                     "valuation": 0,
 *                     "balance": "0"
 *                 },
 *                 "yt": {
 *                     "valuation": 11.416728510116576,
 *                     "balance": "15729258848120172762"
 *                 },
 *                 "lp": {
 *                     "valuation": 0,
 *                     "balance": "0",
 *                     "activeBalance": "0"
 *                 }
 *             }
 *         ],
 *         "closedPositions": [],
 *         "syPositions": [],
 *         "updatedAt": "2025-09-18T07:37:01.541Z"
 *     },
 *     {
 *         ...
 *     },
 *     ...
 * }
 * ]
 *
 * TODO: Include closed positions (only for active markets? I hope so
 * because otherwsise we will need to call get inactive markets
 * which might include a lot of markets.)
 */
export async function formatPositionsCompact(positionsForAllChains: ChainPositions[], linePrefix: string = ''): Promise<string> {
    let formattedParts = [];
    const pendleClient = new PendleClient();
    for (const chainPositions of positionsForAllChains) {
        const chainName = getChainNameFromChainId(chainPositions.chainId);
        const chainMarkets = await pendleClient.getActiveMarkets(chainPositions.chainId);
        for (const marketPositions of chainPositions.openPositions) {
            const market = getMarketFromMarketId(marketPositions.marketId, chainMarkets);
            for (const token in marketPositions) {
                if (!['pt', 'yt', 'lp'].includes(token)) {
                    continue;
                }
                // p has the format:
                // {
                //     "valuation": 0,
                //     "balance": "0"
                //     "activeBalance": "0" // only for LP
                //     "claimTokenAmounts": [] // only for LP and YT
                // }
                const p = marketPositions[token as 'pt' | 'yt' | 'lp'];
                if (Object.keys(p).length === 0 || p.valuation === 0) {
                    continue;
                }
                let parts = [
                    `${market.name}-${token.toUpperCase()} position`,
                    `on ${chainName}`,
                    `worth ${p.valuation} USD`,
                    `expires on ${market.expiry}`,
                    `${p?.claimTokenAmounts?.length > 0 ? `(has claimable yield)` : ''}`,
                ];
                formattedParts.push(parts.join(' '));
            }
        }
    }
    return formattedParts.join('\n').replace(/^/gm, linePrefix);
}

/**
 * The market ID in the positions object is returned as
 * <CHAIN ID>-<MARKET ADDRESS>, for example:
 * "marketId": "999-0x8867d2b7adb8609c51810237ecc9a25a2f601b97"
 * Here we extract the market object, that contains the name, address, expiry, etc
 */
function getMarketFromMarketId(marketId: string, markets: MarketCompactData[]): MarketCompactData {
    const marketAddress = marketId.split('-')[1];
    const market = markets.find((market) => market.address === marketAddress);
    if (!market) {
        throw new Error(`Market not found for address: ${marketAddress}`);
    }
    return market;
}
