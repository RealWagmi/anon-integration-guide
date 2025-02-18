import chalk from 'chalk';
import { askSynFutures } from './askSynFutures';
import 'dotenv/config';

// Ensure required environment variables are set
if (!process.env.PRIVATE_KEY) {
    console.error(chalk.red('Error: PRIVATE_KEY environment variable is required'));
    console.log(chalk.gray('\nPlease set the following environment variables:'));
    console.log(chalk.gray('- PRIVATE_KEY: Your private key for signing transactions'));
    console.log(chalk.gray('- RPC_URL: (Optional) RPC endpoint URL, defaults to Base Goerli'));
    process.exit(1);
}

const question = process.argv.slice(2).filter(arg => arg !== '--verbose').join(' ');
if (!question) {
    console.error(chalk.red('Please provide a command as an argument'));
    console.log('\nExample commands:');
    console.log(chalk.gray('- "Open a long position with 2x leverage using 0.1 ETH as margin"'));
    console.log(chalk.gray('- "Place a limit sell order for 0.5 ETH at 2000 USDC"'));
    console.log(chalk.gray('- "Provide liquidity to ETH-USDC pool between 1800-2200 with 1 ETH"'));
    console.log(chalk.gray('- "Remove 50% liquidity from position #123"'));
    process.exit(1);
}

const verbose = process.argv.includes('--verbose');

async function main() {
    try {
        // Log configuration in verbose mode
        if (verbose) {
            console.log(chalk.blue('\nConfiguration:'));
            console.log(chalk.gray(`Network: ${process.env.CHAIN_NAME || 'BASE'}`));
            console.log(chalk.gray(`RPC URL: ${process.env.RPC_URL || 'Base Goerli (default)'}`));
            console.log(chalk.gray(`Test Mode: ${process.env.IS_TEST === 'true' ? 'Yes' : 'No'}`));
            console.log(chalk.blue('\nProcessing command:'), chalk.white(question));
        }

        const result = await askSynFutures(question, { 
            verbose,
            notify: async (message) => console.log(chalk.blue(`\n[Notification] ${message}`))
        });
        
        if (!result.success) {
            console.error(chalk.red(`\nError: ${result.data}`));
            process.exit(1);
        }

        console.log(chalk.green('\n✅ Success:'), chalk.white(result.data));
    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : 'Unknown error occurred');
        if (verbose && error instanceof Error && error.stack) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(chalk.red('\n💥 Unexpected error:'), error);
    process.exit(1);
}); 