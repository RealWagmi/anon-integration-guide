import OpenAI from 'openai';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, createWalletClient } from 'viem';
import { sonic } from 'viem/chains';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { tools } from '../tools';
import * as functions from '../functions';
import util from 'util';
import chalk from 'chalk';
import { fromHeyAnonToolsToOpenAiTools } from '../helpers/openai';

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

/**
 * The askBeets agent.
 *
 * Ask the agent a question or give it an order.  The agent will use the tools
 * defined in the tools.ts file to perform the necessary operations.
 *
 * The agent has an additional step to analyze the data provided by the tools
 * and provide a final answer.
 *
 * For example, if asked "Show the withdrawal request with the highest amount",
 * the agent will:
 * 1. First call getOpenWithdrawRequests
 * 2. Then analyze the response to find the highest amount
 * 3. Then provide the answer
 */
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
            For operations that require multiple steps (like "withdraw all"), you should first get required information before executing actions.
            For example, to withdraw all liquidity positions:
            1. First call getMyPositionsPortfolio to get a list of all the positions
            2. Then use the ID of each position to withdraw it

            IMPORTANT: For analytical questions about data:
            1. ALWAYS call the relevant tool first to get the data
            2. When you receive the tool response, analyze the data and provide the answer
            3. DO NOT try to answer analytical questions without first calling the appropriate tool

            For example:
            - If asked "Show my position with the highest TVL":
              1. First call getMyPositionsPortfolio
              2. Then analyze the response to find the position with the highest dollar value of TVL

            After each tool response, analyze the data to determine if:
            - Additional steps are needed
            - The data needs to be processed to answer the user's question (e.g., finding highest/lowest values, filtering, etc.)
            
            All tools will need the chainName and account arguments: chainName: "sonic", account: "${signer.address}".`,
        },
        { role: 'user', content: question },
    ];

    const results: FunctionReturn[] = [];
    let isComplete = false;

    if (options?.verbose) {
        console.log('System prompt:', util.inspect(messages[0], { depth: null, colors: true }));
    }

    while (!isComplete) {
        // Call the LLM to determine which tools to call
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            tools: tools.map((tool) => fromHeyAnonToolsToOpenAiTools(tool)),
            tool_choice: 'auto',
        });

        // Add the LLM response to the conversation
        const assistantMessage = completion.choices[0].message;
        messages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
        });

        if (options?.verbose) {
            console.log('LLM says:', util.inspect(messages[messages.length - 1], { depth: null, colors: true }));
        }

        // If no tool calls, the assistant is done
        if (!assistantMessage.tool_calls) {
            isComplete = true;
            // Add the final analysis to results if we have previous tool results
            if (results.length > 0 && assistantMessage.content) {
                return toResult(assistantMessage.content);
            }
            continue;
        }

        // Determine which tool to call and its arguments
        const functionCall = assistantMessage.tool_calls[0];
        const functionName = functionCall.function.name as keyof typeof functions;
        const functionArgs = JSON.parse(functionCall.function.arguments);

        console.log(chalk.gray(`[Debug] Executing function: ${functionName}`));
        console.log(chalk.gray(`[Debug] Args: ${JSON.stringify(functionArgs)}`));

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

            // Add the tool response to the conversation with more context
            messages.push({
                role: 'tool',
                tool_call_id: functionCall.id,
                name: functionName,
                content: JSON.stringify({
                    toolName: functionName,
                    data: result.data,
                }),
            });

            if (options?.verbose) {
                console.log('Tool message:', util.inspect(messages[messages.length - 1], { depth: null, colors: true }));
            }

            // Add an analysis prompt if this was the last tool call
            if (!assistantMessage.tool_calls?.[1]) {
                messages.push({
                    role: 'user',
                    content: 'Provide an answer to my original question using the data you collected. If you need more tools, call them.',
                });
            }
        } catch (error) {
            return toResult(`Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
    }

    // Modify the final return logic
    if (results.length === 0) {
        return toResult('Could not identify any operations to perform.', true);
    } else if (results.length === 1 && !messages[messages.length - 1].content) {
        // If we only have one result and no final analysis, return the tool result
        return results[0];
    }

    // If we have a final analysis message, use that as the result
    const finalMessage = messages[messages.length - 1];
    if (finalMessage.role === 'assistant' && finalMessage.content) {
        return toResult(finalMessage.content);
    }

    // Fallback to combining all results if no final analysis
    const combinedMessage = results.map((r, i) => `Step ${i + 1}: ${r.data}`).join('\n');
    return toResult(combinedMessage);
}
