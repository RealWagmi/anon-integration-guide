import OpenAI from 'openai';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, createWalletClient } from 'viem';
import { sonic } from 'viem/chains';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { tools } from '../tools';
import * as functions from '../functions';
import util from 'util';
import { fromHeyAnonToolsToOpenAiTools } from '../helpers/openai';
import { parseEther } from 'viem';

interface AskBeetsOptions {
    verbose?: boolean;
    notify?: (message: string) => Promise<void>;
}

interface ConversationMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessage['tool_calls'];
    tool_call_id?: string;
    name?: string;
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

    const signer = privateKeyToAccount(`0x${privateKey}`);
    const provider = createPublicClient({
        chain: sonic,
        transport: http(),
    });

    // Create minimal FunctionOptions object
    const functionOptions: FunctionOptions = {
        getProvider: () => provider,
        sendTransactions: async ({ chainId, account, transactions }) => {
            // Create wallet client
            const walletClient = createWalletClient({
                account: signer,
                chain: provider.chain,
                transport: http(),
            });

            const results = [];

            // Send transactions sequentially
            for (const tx of transactions) {
                const hash = await walletClient.sendTransaction({
                    to: tx.target,
                    data: tx.data,
                    value: tx.value || 0n,
                });

                const receipt = await provider.waitForTransactionReceipt({ hash });

                results.push({
                    hash: receipt.transactionHash,
                    message: `Transaction confirmed with hash: ${receipt.transactionHash}`,
                });
            }

            return {
                isMultisig: false,
                data: results,
            };
        },
        notify,
    };

    const messages: ConversationMessage[] = [
        {
            role: 'system',
            content: `You will interact with the Beets protocol via your tools. Given a request, you will need to determine which tools to call.
            For operations that require multiple steps (like "unstake all"), you should first get required information before executing actions.
            For example, to unstake all tokens:
            1. First call getStakedSonicBalance to get the current balance
            2. Then use that balance amount to call unStake
            After each tool response, determine if additional steps are needed.
            All tools will need the chainName and account arguments: chainName: "sonic", account: "${signer.address}".`,
        },
        { role: 'user', content: question },
    ];

    const results: FunctionReturn[] = [];
    let isComplete = false;

    while (!isComplete) {
        // Call the LLM to determine which tools to call
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            tools: tools.map((tool) => fromHeyAnonToolsToOpenAiTools(tool)),
            tool_choice: 'auto',
        });

        if (options?.verbose) {
            console.log('Messages:', util.inspect(messages, { depth: null, colors: true }));
        }

        // Add the LLM response to the conversation
        const assistantMessage = completion.choices[0].message;
        messages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
        });

        // If no tool calls, the assistant is done
        if (!assistantMessage.tool_calls) {
            isComplete = true;
            continue;
        }

        // Determine which tool to call and its arguments
        const functionCall = assistantMessage.tool_calls[0];
        const functionName = functionCall.function.name as keyof typeof functions;
        const functionArgs = JSON.parse(functionCall.function.arguments);

        console.log(`Executing function: ${functionName}`);
        console.log(`Args: ${JSON.stringify(functionArgs)}`);

        const func = functions[functionName];
        if (!func) {
            return toResult(`Function ${functionName} not found.`, true);
        }

        // Replace chain & address for good measure
        functionArgs.chainName = 'sonic';
        functionArgs.account = signer.address;

        // Call the tool and add the result to the conversation
        try {
            const result = await func(functionArgs, functionOptions);
            results.push(result);

            if (!result.success) {
                return result;
            }

            messages.push({
                role: 'tool',
                tool_call_id: functionCall.id,
                name: functionName,
                content: result.data,
            });
        } catch (error) {
            return toResult(`Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
    }

    // Combine results into a single response
    if (results.length === 0) {
        return toResult('No operations were performed.', true);
    } else if (results.length === 1) {
        return results[0];
    }

    const combinedMessage = results.map((r, i) => `Step ${i + 1}: ${r.data}`).join('\n');
    return toResult(combinedMessage);
}
