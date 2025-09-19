/**
 * Example: How to use flattenAndSortPositions with the Pendle API
 * This demonstrates flattening ChainPositions into individual PT, YT, LP positions
 * sorted by valuation in descending order
 */

import { PendleClient } from '../src/helpers/client';
import { flattenAndSortPositions, formatFlattenedPositions } from '../src/helpers/positions';

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

        console.log(`Found positions on ${positions.length} chain(s)\n`);

        // Flatten and sort positions (now includes market data automatically)
        const flattenedResult = await flattenAndSortPositions(positions);

        console.log('=== FLATTENED AND SORTED POSITIONS ===');
        console.log(`Total Positions: ${flattenedResult.totalPositions}`);
        console.log(`Total Portfolio Value: $${flattenedResult.totalValuation.toFixed(2)}\n`);

        // Display top 10 positions
        console.log('Top 10 Positions by Value:');
        console.log('-'.repeat(80));

        const top10 = flattenedResult.positions.slice(0, 10);
        for (let i = 0; i < top10.length; i++) {
            const pos = top10[i];
            const marketDisplay = pos.marketName ? `${pos.marketName} (${pos.marketExpiry || 'no expiry'})` : pos.marketId.substring(0, 20) + '...';

            console.log(
                `${(i + 1).toString().padStart(2)}. ${pos.tokenType.padEnd(3)} | ` +
                    `$${pos.valuation.toFixed(2).padStart(12)} | ` +
                    `${pos.chainName.padEnd(15)} | ` +
                    `${pos.positionType.padEnd(6)} | ` +
                    `${marketDisplay}`,
            );
        }

        // Format output (market details are already included)
        console.log('\n=== FORMATTED OUTPUT ===');
        const formattedOutput = formatFlattenedPositions(flattenedResult.positions, '');
        console.log(formattedOutput);

        // Print summary of the flattened result
        console.log('\n=== SUMMARY OF POSITIONS ===');
        console.log(`Total Positions: ${flattenedResult.totalPositions}`);
        console.log(`Total Portfolio Value: $${flattenedResult.totalValuation.toFixed(2)}`);

        // Example: Access the raw flattened data
        console.log('\n=== RAW DATA EXAMPLE (First Position) ===');
        if (flattenedResult.positions.length > 0) {
            const firstPosition = flattenedResult.positions[0];
            console.log(JSON.stringify(firstPosition, null, 2));
        }

        // Example: Filter specific token types
        const ytPositions = flattenedResult.positions.filter((p) => p.tokenType === 'YT');
        const lpPositions = flattenedResult.positions.filter((p) => p.tokenType === 'LP');
        const ptPositions = flattenedResult.positions.filter((p) => p.tokenType === 'PT');

        console.log('\n=== BREAKDOWN BY TOKEN TYPE ===');
        console.log(`YT Positions: ${ytPositions.length} (Total: $${ytPositions.reduce((sum, p) => sum + p.valuation, 0).toFixed(2)})`);
        console.log(`LP Positions: ${lpPositions.length} (Total: $${lpPositions.reduce((sum, p) => sum + p.valuation, 0).toFixed(2)})`);
        console.log(`PT Positions: ${ptPositions.length} (Total: $${ptPositions.reduce((sum, p) => sum + p.valuation, 0).toFixed(2)})`);

        // Example: Group by chain
        const positionsByChain = new Map<number, typeof flattenedResult.positions>();
        for (const pos of flattenedResult.positions) {
            if (!positionsByChain.has(pos.chainId)) {
                positionsByChain.set(pos.chainId, []);
            }
            positionsByChain.get(pos.chainId)!.push(pos);
        }

        console.log('\n=== POSITIONS BY CHAIN ===');
        for (const [chainId, chainPositions] of positionsByChain) {
            const chainTotal = chainPositions.reduce((sum, p) => sum + p.valuation, 0);
            const chainName = chainPositions[0]?.chainName || `Chain ${chainId}`;
            console.log(`${chainName}: ${chainPositions.length} positions worth $${chainTotal.toFixed(2)}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    main();
}
