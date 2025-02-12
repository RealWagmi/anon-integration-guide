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

// AI configuration
const OPENAI_MODEL = 'gpt-4o';
const DEEPSEEK_MODEL = 'deepseek-reasoner';
const PROMPT_TYPE: 'minimal' | 'extended' = 'minimal';

// Protocol & chain configuration
const CHAIN_NAME = 'sonic';
const CHAIN_VIEM = sonic;
const PROTOCOL_NAME = 'Beets';

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
    if (PROMPT_TYPE === 'minimal') {
        return getSystemPromptMinimal(options, chainName, account);
    } else {
        return getSystemPromptExtended(options, chainName, account);
    }
}

function getSystemPromptMinimal(options: AskBeetsOptions | undefined, chainName: string, account: string) {
    const basePrompt = `You will interact with the ${PROTOCOL_NAME} protocol via your tools. Given a request, you will need to determine which tools to call.`;

    const toolConfigPrompt = `\nAll tools that require the chainName and account arguments will need the following default values: chainName: "${chainName}", account: "${account}".`;

    return basePrompt + toolConfigPrompt;
}

function getSystemPromptExtended(options: AskBeetsOptions | undefined, chainName: string, account: string) {
    const basePrompt = `You will interact with the ${PROTOCOL_NAME} protocol via your tools. Given a request, you will need to determine which tools to call.

For operations that require multiple steps (like "withdraw all"), you should first get required information before executing actions.
For example, to withdraw all liquidity positions:
1. First call getMyPositionsPortfolio to get a list of all the positions
2. Then use the ID of each position to withdraw it`;

    const rawResponsePrompt = `
IMPORTANT: For all tool responses:
1. Return the EXACT tool response without ANY modifications or analysis
2. Do not reformat, summarize, or add explanatory text
3. Do not interpret or process the data in any way`;

    const toolConfigPrompt = `\nAll tools that require the chainName and account arguments will need the following default values: chainName: "${chainName}", account: "${account}".`;

    const nextStepsPrompt = `\nAfter each tool response, determine if additional steps are needed.`;

    return basePrompt + rawResponsePrompt + toolConfigPrompt + nextStepsPrompt;
}

function getLlmClient() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!openaiApiKey && !deepseekApiKey) {
        throw new Error('OPENAI_API_KEY or DEEPSEEK_API_KEY environment variable is required');
    }
    if (deepseekApiKey) {
        return new OpenAI({ apiKey: deepseekApiKey, baseURL: 'https://api.deepseek.com/v1' });
    } else {
        return new OpenAI({ apiKey: openaiApiKey });
    }
}

function getLlmModel() {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (deepseekApiKey) {
        return DEEPSEEK_MODEL;
    } else {
        return OPENAI_MODEL;
    }
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
    const llmClient = getLlmClient();

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    const notify = options?.notify || (async (message: string) => console.log(`[Notification] ${message}`));

    const signer = privateKeyToAccount(`0x${privateKey}`);
    const provider = createPublicClient({
        chain: CHAIN_VIEM,
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
        signTypedDatas: async (typedDatas) => {
            const signatures = await Promise.all(typedDatas.map((typedData) => signer.signTypedData(typedData)));
            return signatures;
        },
        notify,
    };

    const messages: ConversationMessage[] = [
        {
            role: 'system',
            content: getSystemPrompt(options, CHAIN_NAME, signer.address),
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
        const completion = await llmClient.chat.completions.create({
            model: getLlmModel(),
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

        // Execute all tool calls instead of just the first one
        for (const functionCall of assistantMessage.tool_calls) {
            const functionName = functionCall.function.name as keyof typeof functions;
            const functionArgs = JSON.parse(functionCall.function.arguments);

            console.log(chalk.gray(`[Debug] Executing function: ${functionName}`));
            console.log(chalk.gray(`[Debug] Args: ${JSON.stringify(functionArgs)}`));

            const func = functions[functionName];
            if (!func) {
                throw new Error(`Function ${functionName} not found.`);
            }

            // Replace chain & address for good measure
            functionArgs.chainName = CHAIN_NAME;
            functionArgs.account = signer.address;

            // Call the tool and add the result to the conversation
            try {
                const funcReturn = await func(functionArgs, functionOptions);
                funcReturns.push(funcReturn);
                console.log(chalk.gray(`[Debug] Function returned ${funcReturn.success ? 'success' : 'failure'}`));

                if (!funcReturn.success) {
                    return funcReturn;
                } else {
                    console.log(chalk.gray(`[Debug] Function output: ${funcReturn.data}`));
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
                throw new Error(`Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    // Return if we have no results
    if (funcReturns.length === 0) {
        throw new Error('Could not identify any operations to perform.');
    }

    // Internal consistency check
    const finalMessage = messages[messages.length - 1];
    if (finalMessage.role !== 'assistant') {
        throw new Error('Final message is not an assistant message');
    }
    const assistantFinalComment = finalMessage.content;

    // Return all tool calls followed by the final comment of the assistant
    let combinedMessage = funcReturns
        .map((r, i) => {
            const toolName = messages.find((m) => m.role === 'tool' && m.content === r.data)?.name || 'Unknown Tool';
            const msg = chalk.underline.bold(`TOOL CALL ${i + 1}`) + `: ${toolName}`;
            return `${msg}\n${r.data}`;
        })
        .join('\n');

    // Add the final comment of the assistant
    if (assistantFinalComment) {
        combinedMessage += `\n${chalk.underline.bold('ASSISTANT FINAL COMMENT')}\n${assistantFinalComment}`;
    }

    return toResult(combinedMessage);
}
