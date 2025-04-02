import { askBeets } from './askBeets';
import dotenv from 'dotenv';

dotenv.config();

const question = process.argv[2];
if (!question) {
    console.error('Please provide a question as an argument');
    process.exit(1);
}

const debugLlm = process.argv.includes('--debug-llm');
const debugTools = process.argv.includes('--debug-tools');

async function main() {
    const result = await askBeets(question, { debugLlm, debugTools });
    if (!result.success) {
        console.error(`${result.data}`);
        process.exit(0);
    }
    console.log(`[Response]\n${result.data}`);
}

main().catch(console.error);
