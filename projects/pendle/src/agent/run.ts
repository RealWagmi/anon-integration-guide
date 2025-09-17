import { agent } from './agent';
import dotenv from 'dotenv';
import { Command } from 'commander';
import { getViemChainFromAnonChainName } from '../helpers/chains';
import { http, createPublicClient } from 'viem';

dotenv.config();

const program = new Command();

program
    .name('agent')
    .description('Interact with the agent using natural language')
    .argument('<action>', 'The action to perform on the agent')
    .requiredOption('--chain <chain>', 'The blockchain to query (ethereum, bsc, arbitrum...)')
    .option('--debug-llm', 'Enable LLM debugging')
    .option('--debug-tools', 'Enable tools debugging')
    .parse();

const options = program.opts();
const action = program.args[0];

async function main() {
    // Get provider
    const viemChain = getViemChainFromAnonChainName(options.chain);
    const provider = createPublicClient({ chain: viemChain, transport: http() });

    // Ask the agent
    const result = await agent({
        action,
        provider,
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
