import { askBeets } from './askBeets';
import dotenv from 'dotenv';

dotenv.config();

const question = process.argv[2];
if (!question) {
    console.error('Please provide a question as an argument');
    process.exit(1);
}

const verbose = process.argv.includes('--verbose');
const analysis = process.argv.includes('--analysis');

async function main() {
    const result = await askBeets(question, { verbose, analysis });
    if (!result.success) {
        console.error(`${result.data}`);
        process.exit(0);
    }
    console.log(`[Response]\n${result.data}`);
}

main().catch(console.error);
