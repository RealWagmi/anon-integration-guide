import * as ccxt from 'ccxt';
import OpenAI from 'openai';
import { tools } from '../tools';
import { tools as askBinanceTools } from './tools';
import * as heyAnonFunctions from '../functions';
import util from 'util';
import chalk from 'chalk';
import { fromHeyAnonToolsToOpenAiTools } from './helpers/openai';
import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';

// AI configuration
const OPENAI_MODEL = 'gpt-4o';
const DEEPSEEK_MODEL = 'deepseek-reasoner';

// Protocol & chain configuration
const EXCHANGE_NAME = 'BinanceUSDM';

// Merge HeyAnon & AskBinance functions (no AskBinance functions yet)
const functions = { ...heyAnonFunctions };

interface ConversationMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessage['tool_calls'];
    tool_call_id?: string;
    name?: string;
}

function getSystemPrompt() {
    return `You will interact with ${EXCHANGE_NAME} exchange via your tools.
 You MUST ALWAYS call a tool to get information. 
 NEVER try to guess market symbols or currency names without calling the appropriate tool.
 You WILL NOT modify market symbols or currency names, not even to make them plural.`;
}

/**
 * Get authenticated exchange object from the CCXT library.
 *
 * If the ${EXCHANGE_NAME}_API_KEY and ${EXCHANGE_NAME}_SECRET_KEY
 * environment variables are set, use them to create the exchange.
 * Otherwise, throw an error.
 *
 * If the ${EXCHANGE_NAME}_USE_TESTNET environment variable is set
 * to true, use the sandbox/testnet mode, which requires different
 * API keys.
 *
 * Sandbox docs:
 * - https://docs.ccxt.com/#/README?id=testnets-and-sandbox-environments
 */
function getExchange() {
    // Is exchange supported?
    if (!Object.keys(ccxt).includes(EXCHANGE_NAME.toLowerCase())) {
        throw new Error(`Exchange named '${EXCHANGE_NAME}' is not supported by CCXT.`);
    }

    // Should we use testnet?
    const envVarPrefix = `${EXCHANGE_NAME.toUpperCase()}_`;
    const useTestnet = process.env[`${envVarPrefix}USE_TESTNET`] === 'true';
    let apiKeyEnvVar: string | undefined;
    let secretKeyEnvVar: string | undefined;
    if (useTestnet) {
        console.log(chalk.bgGreenBright(`[Debug] Using testnet`));
        apiKeyEnvVar = `${envVarPrefix}TESTNET_API_KEY`;
        secretKeyEnvVar = `${envVarPrefix}TESTNET_SECRET_KEY`;
    } else {
        console.log(chalk.bgYellowBright(`[Warning] Using mainnet`));
        apiKeyEnvVar = `${envVarPrefix}API_KEY`;
        secretKeyEnvVar = `${envVarPrefix}SECRET_KEY`;
    }

    // Get API keys from environment
    const exchangeApiKey = process.env[apiKeyEnvVar];
    const exchangeSecret = process.env[secretKeyEnvVar];
    if (!exchangeApiKey || !exchangeSecret) {
        throw new Error(`${apiKeyEnvVar} and ${secretKeyEnvVar} environment variables are required`);
    }

    // Get exchange object
    let exchange: ccxt.Exchange;
    try {
        exchange = new (ccxt as any)[EXCHANGE_NAME.toLowerCase()]({ apiKey: exchangeApiKey, secret: exchangeSecret });
    } catch (error) {
        throw new Error(`Failed to create ${EXCHANGE_NAME} exchange: ${error instanceof Error ? `${error.message}` : 'Unknown error'}`);
    }

    // Set testnet if requested
    if (useTestnet) {
        if (!exchange.has['sandbox']) {
            throw new Error(`${EXCHANGE_NAME} does not support sandbox mode`);
        }
        exchange.setSandboxMode(true);
    }

    // Return exchange object
    return exchange;
}

/**
 * Get the LLM client.
 *
 * If the DEEPSEEK_API_KEY environment variable is set, use the DeepSeek API.
 * Otherwise, use the OpenAI API.
 */
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

interface AskBinanceOptions {
    action: string;
    debugLlm?: boolean;
    debugTools?: boolean;
    notify?: (message: string) => Promise<void>;
}

/**
 * The askBinance agent.
 *
 * Ask the agent to perform an action.  The agent will use the tools
 * defined in the tools.ts file to perform the necessary operations.
 *
 * The agent has an additional step to analyze the data provided by the tools
 * and provide a final answer.
 */
export async function askBinance({ action, debugLlm, debugTools, notify }: AskBinanceOptions): Promise<FunctionReturn> {
    const llmClient = getLlmClient();

    notify = notify || (async (message: string) => console.log(`[Notification] ${message}`));

    // Create minimal FunctionOptions object
    const functionOptions = {
        notify,
        exchange: getExchange(),
    } as FunctionOptionsWithExchange;

    const messages: ConversationMessage[] = [
        {
            role: 'system',
            content: getSystemPrompt(),
        },
        { role: 'user', content: action },
    ];

    const funcReturns: FunctionReturn[] = [];
    let isComplete = false;

    if (debugLlm) {
        console.log('System prompt:', util.inspect(messages[0], { depth: null, colors: true }));
    }

    while (!isComplete) {
        // Uncomment to debug the tool configuration
        // console.log(
        //     util.inspect(
        //         [...tools, ...askBinanceTools].map((tool) => fromHeyAnonToolsToOpenAiTools(tool)),
        //         { depth: null, colors: true },
        //     ),
        // );
        // Call the LLM to determine which tools to call
        const completion = await llmClient.chat.completions.create({
            model: getLlmModel(),
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            tools: [...tools, ...askBinanceTools].map((tool) => fromHeyAnonToolsToOpenAiTools(tool)),
            tool_choice: 'auto',
        });

        // Add the LLM response to the conversation
        const assistantMessage = completion.choices[0].message;
        messages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
        });

        if (debugLlm) {
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

            // Call the tool and add the result to the conversation
            try {
                const funcReturn = await func(functionArgs, functionOptions);
                funcReturns.push(funcReturn);
                if (!funcReturn.success) {
                    console.log(chalk.gray(`[Debug] Function returned failure`));
                }

                if (!funcReturn.success) {
                    return funcReturn;
                } else if (debugTools) {
                    console.log(chalk.gray(`[Debug] Function output: ${funcReturn.data}`));
                }

                // Add the tool response to the conversation with more context
                messages.push({
                    role: 'tool',
                    tool_call_id: functionCall.id,
                    name: functionName,
                    content: funcReturn.data,
                });

                if (debugLlm) {
                    console.log(`Tool '${functionName}' message:`, util.inspect(messages[messages.length - 1], { depth: null, colors: true }));
                }
            } catch (error) {
                throw new Error(`Tool '${functionName}' failed to execute: ${error instanceof Error ? `${error.message}` : 'Unknown error'}`);
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

    // If the user asked to show the tool calls, add them to the message;
    // otherwise, show only the result of the final tool call
    let combinedMessage = '';
    if (debugTools) {
        combinedMessage += funcReturns
            .map((r, i) => {
                const toolName = messages.find((m) => m.role === 'tool' && m.content === r.data)?.name || 'Unknown Tool';
                let msg = chalk.underline.bold(`TOOL CALL ${i + 1}`) + `: ${toolName}`;
                if (debugTools) msg += `\n${r.data}`;
                return msg;
            })
            .join('\n');
    } else {
        combinedMessage += funcReturns[funcReturns.length - 1].data;
    }

    // Optionally add the final comment of the assistant
    if (assistantFinalComment && debugLlm) {
        combinedMessage += `\n${chalk.underline.bold('ASSISTANT FINAL COMMENT')}\n${assistantFinalComment}`;
    }

    return toResult(combinedMessage);
}
