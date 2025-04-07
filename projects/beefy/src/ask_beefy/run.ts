import { askBeefy } from './askBeefy';
import dotenv from 'dotenv';
import { Command } from 'commander';
import { getViemChainFromAnonChainName } from '../helpers/chains';
import { http, createPublicClient } from 'viem';

dotenv.config();

const program = new Command();

program
    .name('ask-beefy')
    .description('Interact with Beefy Finance using natural language')
    .argument('<question>', 'The question to ask about Beefy Finance')
    .requiredOption('--chain <chain>', 'The blockchain to query (sonic, ethereum, bsc...)')
    .option('--debug-llm', 'Enable LLM debugging')
    .option('--debug-tools', 'Enable tools debugging')
    .parse();

const options = program.opts();
const question = program.args[0];

async function main() {
    // Get provider
    const viemChain = getViemChainFromAnonChainName(options.chain);
    const provider = createPublicClient({ chain: viemChain, transport: http() });

    // Ask Beefy
    const result = await askBeefy({
        question,
        provider,
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
