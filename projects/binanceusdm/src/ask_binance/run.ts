import { askBinance } from './askBinance';
import dotenv from 'dotenv';
import { Command } from 'commander';

dotenv.config();

const program = new Command();

program
    .name('ask-binance')
    .description('Interact with Binance USDM futures using natural language')
    .argument('<action>', 'The action to perform on Binance')
    .option('--debug-llm', 'Enable LLM debugging')
    .option('--debug-tools', 'Enable tools debugging')
    .parse();

const options = program.opts();
const action = program.args[0];

async function main() {
    // Ask Binance
    const result = await askBinance({
        action,
        debugLlm: options.debugLlm,
        debugTools: options.debugTools,
    });

    // Print result
    if (!result.success) {
        console.error(`${result.data}`);
        process.exit(0);
    }
    console.log(`[Response]\n${result.data}`);
}

main().catch(console.error);
