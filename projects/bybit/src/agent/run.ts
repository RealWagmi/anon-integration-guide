import { agent } from './agent';
import dotenv from 'dotenv';
import { Command } from 'commander';

dotenv.config();

const program = new Command();

program
    .name('agent')
    .description('Interact with the agent using natural language')
    .argument('<action>', 'The action to perform on the agent')
    .option('--debug-llm', 'Enable LLM debugging')
    .option('--debug-tools', 'Enable tools debugging')
    .parse();

const options = program.opts();
const action = program.args[0];

async function main() {
    // Ask the agent
    const result = await agent({
        action,
        debugLlm: options.debugLlm,
        debugTools: options.debugTools,
    });

    // Print result
    if (!result.success) {
        console.error(`${result.data}`);
        process.exit(0);
    }
    console.log(`[Last Tool Call Response]\n${result.data}`);
}

main().catch(console.error);
