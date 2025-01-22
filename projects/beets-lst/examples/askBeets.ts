import OpenAI from 'openai';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { sonic } from 'viem/chains';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { tools } from '../tools';
import * as functions from '../functions';
import util from 'util';
import { fromHeyAnonToolsToOpenAiTools } from '../helpers/openai';

interface AskBeetsOptions {
    verbose?: boolean;
    notify?: (message: string) => Promise<void>;
}

export async function askBeets(question: string, options?: AskBeetsOptions): Promise<FunctionReturn> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    const notify = options?.notify || (async (message: string) => console.log(`[Notification] ${message}`));

    const account = privateKeyToAccount(`0x${privateKey}`);
    const provider = createPublicClient({
        chain: sonic,
        transport: http(),
    });

    // Create minimal FunctionOptions object
    const functionOptions: FunctionOptions = {
        getProvider: () => provider,
        sendTransactions: async () => {
            throw new Error('Not implemented');
        },
        notify,
    };

    // Ask OpenAI to determine which function to call, including
    // a system message to specify the chain and account
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a helpful assistant that can help me interact with the Beets protocol. You will be given a question and you will need to determine which tools to call.  All functions will need the chainName and account arguments,
                that you will need to fill in this way: chainName: "sonic", account: "${account.address}".`,
            },
            { role: 'user', content: question },
        ],
        tools: tools.map((tool) => fromHeyAnonToolsToOpenAiTools(tool)),
    });

    if (options?.verbose) {
        console.log('Completion:', util.inspect(completion, { depth: null, colors: true }));
    }

    const functionCalls = completion.choices[0].message.tool_calls;
    if (!functionCalls) {
        return toResult("I couldn't determine what operation you want to perform.", true);
    }
    if (functionCalls.length > 1) {
        console.log(`Multiple functions found: ${functionCalls.map((call) => call.function.name).join(', ')}`);
        console.log(`Will only execute the first one.`);
    }

    const functionCall = functionCalls[0];

    // Get the function to call from our functions object
    const functionName = functionCall.function.name as keyof typeof functions;
    const functionArgs = JSON.parse(functionCall.function.arguments);

    console.log(`Function: ${functionName}`);
    console.log(`Args: ${JSON.stringify(functionArgs)}`);

    const func = functions[functionName];
    if (!func) {
        return toResult(`Function ${functionName} not found.`, true);
    }

    // Replace chain & address for good measure
    functionArgs.chainName = 'sonic';
    functionArgs.account = account.address;

    // Call the function with the parsed arguments
    return await func(functionArgs, functionOptions);
}
