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
    analysis?: boolean;
}

interface ConversationMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessage['tool_calls'];
    tool_call_id?: string;
    name?: string;
}

function getSystemPrompt(options: AskBeetsOptions | undefined, chainName: string, account: string) {
    const basePrompt = `You will interact with the Beets protocol via your tools. Given a request, you will need to determine which tools to call.

For operations that require multiple steps (like "withdraw all"), you should first get required information before executing actions.
For example, to withdraw all liquidity positions:
1. First call getMyPositionsPortfolio to get a list of all the positions
2. Then use the ID of each position to withdraw it`;

    const rawResponsePrompt = `
IMPORTANT: For all tool responses:
1. Return the EXACT tool response without ANY modifications or analysis
2. Do not reformat, summarize, or add explanatory text
3. Do not interpret or process the data in any way`;

    const toolConfigPrompt = `\nAll tools will need the chainName and account arguments: chainName: "${chainName}", account: "${account}".`;

    const nextStepsPrompt = `\nAfter each tool response, determine if additional steps are needed.`;

    return basePrompt + 
           rawResponsePrompt + 
           toolConfigPrompt + 
           nextStepsPrompt;
}

/**
 * The askBeets agent.
 *
 * Ask the agent a question or give it an order.  The agent will use the tools
 * defined in the tools.ts file to perform the necessary operations.
 *
 * The agent has an additional step to analyze the data provided by the tools
 * and provide a final answer.
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

            const txsReturns = [];

            // Send transactions sequentially
            for (const tx of transactions) {
                const hash = await walletClient.sendTransaction({
                    to: tx.target,
                    data: tx.data,
                    value: tx.value || 0n,
                });

                const receipt = await provider.waitForTransactionReceipt({ hash });

                txsReturns.push({
                    hash: receipt.transactionHash,
                    message: `Transaction confirmed with hash: ${receipt.transactionHash}`,
                });
            }

            return {
                isMultisig: false,
                data: txsReturns,
            };
        },
        notify,
    };

    const messages: ConversationMessage[] = [
        {
            role: 'system',
            content: getSystemPrompt(options, 'sonic', signer.address),
        },
        { role: 'user', content: question },
    ];

    const funcReturns: FunctionReturn[] = [];
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
            const funcReturn = await func(functionArgs, functionOptions);
            funcReturns.push(funcReturn);
            console.log(chalk.gray(`[Debug] Tool returned ${funcReturn.success ? 'success' : 'failure'}`));

            if (!funcReturn.success) {
                return funcReturn;
            }

            // Add the tool response to the conversation with more context
            messages.push({
                role: 'tool',
                tool_call_id: functionCall.id,
                name: functionName,
                content: funcReturn.data,
            });

            if (options?.verbose) {
                console.log(`Tool '${functionName}' message:`, util.inspect(messages[messages.length - 1], { depth: null, colors: true }));
            }
        } catch (error) {
            return toResult(`Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
    }

    // Return if we have no results
    if (funcReturns.length === 0) {
        return toResult('Could not identify any operations to perform.', true);
    }

    // Internal consistency check
    const finalMessage = messages[messages.length - 1];
    if (finalMessage.role !== 'assistant') {
        throw new Error('Final message is not an assistant message');
    }
    const assistantFinalComment = finalMessage.content;

    // Return all tool calls followed by the final comment of the assistant
    let combinedMessage = funcReturns.map((r, i) => {
        const msg = chalk.underline.bold(`TOOL CALL ${i + 1}`);
        return `${msg}\n${r.data}`;
    }).join('\n');

    // Add the final comment of the assistant
    if (assistantFinalComment) {
        combinedMessage += `\n${chalk.underline.bold('ASSISTANT FINAL COMMENT')}\n${assistantFinalComment}`;
    }

    return toResult(combinedMessage);
}
