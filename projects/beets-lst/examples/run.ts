import { askBeets } from './askBeets';
import dotenv from 'dotenv';

dotenv.config();

const question = process.argv[2];
if (!question) {
    console.error('Please provide a question as an argument');
    process.exit(1);
}

async function main() {
    const result = await askBeets(question);
    if (!result.success) {
        console.error(`Error: ${result.data}`);
        process.exit(1);
    }
    console.log(`Q: ${question}`);
    console.log(`A: ${result.data}`);
}

main().catch(console.error);
