import { askSynFutures } from './askSynFutures';
import { config } from 'dotenv';
import chalk from 'chalk';
import minimist from 'minimist';

async function main() {
    // Load environment variables
    config();

    // Parse command line arguments
    const argv = minimist(process.argv.slice(2));
    const question = argv._.join(' ');
    const verbose = argv.verbose || false;

    if (!question) {
        console.error(chalk.red('Please provide a question or command.'));
        console.error(chalk.gray('Example: pnpm ask "Open a long position with 2x leverage using 0.1 ETH as margin"'));
        process.exit(1);
    }

    try {
        const result = await askSynFutures(question, { verbose });
        if (result.success) {
            console.log(chalk.green('\nSuccess:'));
            console.log(result.data);
        } else {
            console.error(chalk.red('\nError:'));
            console.error(result.data);
        }
    } catch (error) {
        console.error(chalk.red('\nError:'));
        console.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

main(); 