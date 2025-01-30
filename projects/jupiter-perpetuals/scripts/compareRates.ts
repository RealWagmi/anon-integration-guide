import { AccountMonitor } from '../services/accountMonitor';
import { AssetType } from '../types';

// Define the rate data interface if it's not already defined in types.ts
interface RateData {
    utilization: number;
    annualRate: number;
    hourlyRate: number;
    timestamp: number;
}

async function compareJupiterRates() {
    // Create a new monitor instance with default RPC URL
    const monitor = new AccountMonitor('https://api.mainnet-beta.solana.com');
    
    // Get current rates for SOL
    const solRates = await monitor.getCurrentRates('SOL' as AssetType);
    
    if (solRates) {
        console.log('SOL Rates Comparison');
        console.log('-------------------');
        console.log('Our calculation:');
        console.log(`Hourly Rate: ${solRates.hourlyRate.toFixed(4)}% / hr`);
        console.log(`Utilization: ${solRates.utilization.toFixed(2)}%`);
        console.log('\nCompare these numbers with:');
        console.log('https://jup.ag/perps');
    }

    // Keep monitoring for changes
    monitor.onRateUpdate((asset: AssetType, rates: RateData) => {
        if (asset === 'SOL') {
            console.log(`\n[${new Date().toISOString()}] Rate Update:`);
            console.log(`Hourly Rate: ${rates.hourlyRate.toFixed(4)}% / hr`);
            console.log(`Utilization: ${rates.utilization.toFixed(2)}%`);
        }
    });

    await monitor.start();

    // Keep the process running
    console.log('\nMonitoring for rate changes... (Ctrl+C to stop)');

    // Handle cleanup on process exit
    process.on('SIGINT', async () => {
        console.log('\nStopping monitor...');
        await monitor.stop();
        process.exit();
    });
}

compareJupiterRates().catch(console.error);