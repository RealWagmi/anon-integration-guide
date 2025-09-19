/**
 * Example: How to use sortPositionsByValuation with the Pendle API
 */

import { PendleClient } from '../src/helpers/client';
import { sortPositionsByValuation, printPositionsSummary } from '../src/helpers/positions';

async function main() {
    try {
        // Initialize the Pendle client
        const client = new PendleClient();

        // Replace with your actual wallet address
        const walletAddress = '0xYourWalletAddressHere';

        console.log(`Fetching positions for wallet: ${walletAddress}...`);

        // Fetch positions from the API
        const positions = await client.getAddressPositions(walletAddress as `0x${string}`);

        if (!positions || positions.length === 0) {
            console.log('No positions found for this wallet.');
            return;
        }

        console.log(`Found positions on ${positions.length} chain(s)`);
        console.log('\n=== BEFORE SORTING ===');
        console.log('Chain order:', positions.map((p) => `Chain ${p.chainId}`).join(', '));

        // Sort the positions by valuation
        const sortedResult = sortPositionsByValuation(positions);

        console.log('\n=== AFTER SORTING ===');
        console.log('Chain order:', sortedResult.sortedPositions.map((p) => `Chain ${p.chainId}`).join(', '));

        // Print detailed summary
        printPositionsSummary(sortedResult);

        // Access the sorted data structure
        console.log('\n=== Detailed Breakdown ===');
        for (const chain of sortedResult.sortedPositions) {
            console.log(`\nChain ${chain.chainId}:`);

            // Process open positions
            if (chain.openPositions && chain.openPositions.length > 0) {
                console.log('  Open Positions:');
                for (const market of chain.openPositions) {
                    const marketValuation = (market.pt?.valuation || 0) + (market.yt?.valuation || 0) + (market.lp?.valuation || 0);

                    if (marketValuation > 0) {
                        console.log(`    Market ${market.marketId}:`);

                        // The tokens are now sorted by valuation within the market object
                        // We can iterate through them in order
                        const tokenOrder = Object.keys(market).filter((k) => ['pt', 'yt', 'lp'].includes(k));
                        for (const tokenType of tokenOrder) {
                            const token = market[tokenType as 'pt' | 'yt' | 'lp'];
                            if (token && token.valuation > 0) {
                                console.log(`      ${tokenType.toUpperCase()}: $${token.valuation.toFixed(2)} (Balance: ${token.balance})`);
                            }
                        }
                    }
                }
            }

            // Process closed positions
            if (chain.closedPositions && chain.closedPositions.length > 0) {
                console.log('  Closed Positions:');
                for (const market of chain.closedPositions) {
                    const marketValuation = (market.pt?.valuation || 0) + (market.yt?.valuation || 0) + (market.lp?.valuation || 0);

                    if (marketValuation > 0) {
                        console.log(`    Market ${market.marketId}:`);

                        const tokenOrder = Object.keys(market).filter((k) => ['pt', 'yt', 'lp'].includes(k));
                        for (const tokenType of tokenOrder) {
                            const token = market[tokenType as 'pt' | 'yt' | 'lp'];
                            if (token && token.valuation > 0) {
                                console.log(`      ${tokenType.toUpperCase()}: $${token.valuation.toFixed(2)} (Balance: ${token.balance})`);
                            }
                        }
                    }
                }
            }
        }

        // You can now use sortedResult.sortedPositions which has the same structure
        // as the original response but sorted by valuation at all levels
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    main();
}
