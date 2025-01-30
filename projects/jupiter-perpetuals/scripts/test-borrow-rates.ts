// scripts/test-borrow-rates.ts
import { getBorrowRates } from '../functions/getBorrowRates';
import { AssetType } from '../types';

interface RateInfo {
    borrowRate: string;
    utilization: string;
    availableLiquidity: string;
}

interface ParsedResponse {
    asset: string;
    long: RateInfo;
    short: RateInfo;
    openFee: string;
    timestamp?: number;
}

async function testBorrowRates() {
    try {
        const validAssets: AssetType[] = ['SOL', 'ETH', 'WBTC'];

        console.log('\n=== Testing Valid Assets ===');
        const results: Record<string, ParsedResponse> = {};

        // Test each valid asset
        for (const asset of validAssets) {
            console.log(`\nFetching rates for ${asset}...`);
            const startTime = Date.now();

            const result = await getBorrowRates({ asset });
            const duration = Date.now() - startTime;

            if (result.success) {
                const parsedData = JSON.parse(result.data) as ParsedResponse;
                results[asset] = parsedData;

                console.log(`✅ Success (${duration}ms):`);
                console.log(`Long Borrow Rate: ${parsedData.long.borrowRate}%`);
                console.log(`Short Borrow Rate: ${parsedData.short.borrowRate}%`);
                console.log(`Open Fee: ${parsedData.openFee}%`);
                console.log(`Long Utilization: ${parsedData.long.utilization}%`);
                console.log(`Short Utilization: ${parsedData.short.utilization}%`);
            } else {
                console.log(`❌ Error (${duration}ms):`, result.data);
            }
        }

        // Compare rates across assets
        if (Object.keys(results).length > 1) {
            console.log('\n=== Rate Comparison ===');
            console.log('Asset\tLong Rate\tShort Rate\tOpen Fee');
            console.log('-----\t---------\t----------\t--------');
            for (const [asset, data] of Object.entries(results)) {
                console.log(`${asset}\t${data.long.borrowRate}%\t\t${data.short.borrowRate}%\t\t${data.openFee}%`);
            }
        }

        // Test invalid asset
        console.log('\n=== Testing Invalid Asset ===');
        const invalidResult = await getBorrowRates({ asset: 'INVALID' as AssetType });
        console.log(JSON.stringify(invalidResult, null, 2));
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the tests
console.log('Starting borrow rates test...');
testBorrowRates()
    .then(() => console.log('\nTest completed!'))
    .catch((error) => console.error('\nTest failed:', error));
