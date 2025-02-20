import OpenAI from 'openai';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, createWalletClient, type PublicClient, defineChain } from 'viem';
import { FunctionOptions, FunctionReturn } from '../types';
import { toResult } from '../constants';
import { tools } from '../tools';
import * as functions from '../functions';
import util from 'util';
import chalk from 'chalk';

// AI configuration
const OPENAI_MODEL = 'gpt-4';

// Protocol & chain configuration
const CHAIN_NAME = 'BASE_SEPOLIA';

// Define Base Sepolia chain
const baseSepolia = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://sepolia.base.org'],
        },
        public: {
            http: ['https://sepolia.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Base Sepolia Explorer',
            url: 'https://sepolia-explorer.base.org',
        },
    },
    testnet: true,
});

const CHAIN_VIEM = baseSepolia;
const PROTOCOL_NAME = 'SynFutures';

interface AskSynFuturesOptions {
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

function getSystemPrompt(_options: AskSynFuturesOptions | undefined, chainName: string, account: string) {
    const basePrompt = `You are a transaction executor for the ${PROTOCOL_NAME} protocol. Your role is to execute commands using the available tools, not explain them. Given a request, you must determine which tools to call and execute them.`;
    const tokenPrompt = `\nYou WILL NOT modify token addresses, names or symbols, not even to make them plural.`;
    const toolConfigPrompt = `\nAll tools that require the chainName and account arguments will need the following default values: chainName: "${chainName}", account: "${account}".`;
    const actionPrompt = `\nAlways use tool_calls to execute commands. Do not explain the commands or provide code examples.`;
    return basePrompt + tokenPrompt + toolConfigPrompt + actionPrompt;
}

function getLlmClient() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }
    return new OpenAI({ apiKey: openaiApiKey });
}

/**
 * The askSynFutures agent.
 * 
 * Ask the agent a question or give it an order in natural language.
 * Examples:
 * - "Open a long position with 2x leverage using 0.1 ETH as margin"
 * - "Place a limit sell order for 0.5 ETH at 2000 USDC"
 * - "Provide liquidity to ETH-USDC pool between 1800-2200"
 */
export async function askSynFutures(question: string, options?: AskSynFuturesOptions): Promise<FunctionReturn> {
    const llmClient = getLlmClient();
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Ensure private key is properly formatted
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const signer = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    const notify = options?.notify || (async (message: string) => console.log(`[Notification] ${message}`));

    // Initialize Base Sepolia provider with fallback URLs
    const rpcUrls = [
        'https://sepolia.base.org',
        'https://1rpc.io/base-sepolia',
        'https://base-sepolia-rpc.publicnode.com'
    ];

    const createProviderWithRetry = () => {
        return createPublicClient({
            chain: CHAIN_VIEM,
            transport: http(rpcUrls[0], {
                retryCount: 3,
                retryDelay: 1000,
                timeout: 20000,
            }),
            batch: {
                multicall: true,
            },
        }) as PublicClient;
    };

    const provider = createProviderWithRetry();

    // Create wallet client with retry
    const walletClient = createWalletClient({
        account: signer,
        chain: provider.chain,
        transport: http(rpcUrls[0], {
            retryCount: 3,
            retryDelay: 1000,
            timeout: 20000,
        }),
    });

    // Create function options with proper types
    const functionOptions: FunctionOptions = {
        getProvider: () => provider,
        sendTransactions: async (props) => {
            const txsReturns = [];
            
            // Check wallet balance before proceeding
            const balance = await provider.getBalance({ address: signer.address });
            const balanceInEth = Number(balance) / 1e18;
            
            if (options?.verbose) {
                console.log(chalk.gray('\nWallet Balance:'));
                console.log(chalk.gray(`${balanceInEth.toFixed(4)} ETH`));
            }

            if (balanceInEth < 0.01) {
                throw new Error(`Insufficient balance: ${balanceInEth.toFixed(4)} ETH. Please ensure you have enough ETH for the transaction and gas fees.`);
            }
            
            // Send transactions sequentially
            for (const tx of props.transactions) {
                if (options?.verbose) {
                    console.log(chalk.gray('\nTransaction Details:'));
                    console.log(chalk.gray(`Target: ${tx.target}`));
                    console.log(chalk.gray(`Value: ${tx.value || '0'}`));
                    console.log(chalk.gray(`Data Length: ${tx.data.length} bytes`));
                }

                const hash = await walletClient.sendTransaction({
                    chain: CHAIN_VIEM,
                    to: tx.target,
                    data: tx.data,
                    value: tx.value || 0n,
                });

                await notify?.(`Transaction sent! Waiting for confirmation...\nTransaction Hash: ${hash}\nView on Explorer: https://sepolia-explorer.base.org/tx/${hash}`);

                const receipt = await provider.waitForTransactionReceipt({ hash });
                
                if (receipt.status !== 'success') {
                    throw new Error(`Transaction failed with hash: ${receipt.transactionHash}`);
                }

                txsReturns.push({
                    hash: receipt.transactionHash,
                    message: `Transaction confirmed! Hash: ${receipt.transactionHash}\nView on Explorer: https://sepolia-explorer.base.org/tx/${receipt.transactionHash}`,
                });
            }

            return {
                success: true,
                data: txsReturns,
                isMultisig: false
            };
        },
        notify
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
            model: OPENAI_MODEL,
            messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            tools: tools.map(tool => ({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        type: 'object',
                        properties: Object.fromEntries(
                            tool.props.map(prop => [
                                prop.name,
                                {
                                    type: prop.type,
                                    description: prop.description,
                                    enum: prop.enum,
                                }
                            ])
                        ),
                        required: tool.required,
                    }
                }
            })),
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

        // Execute all tool calls
        for (const functionCall of assistantMessage.tool_calls) {
            const functionName = functionCall.function.name as keyof typeof functions;
            const functionArgs = JSON.parse(functionCall.function.arguments);

            console.log(chalk.gray(`[Debug] Executing function: ${functionName}`));

            // Special handling for position IDs to prevent mangling
            if (functionName === 'removeLiquidity' && question.includes('position')) {
                const positionMatch = question.match(/position (0x[a-fA-F0-9]{64})/);
                if (positionMatch) {
                    functionArgs.positionId = positionMatch[1];
                }
            }

            console.log(chalk.gray(`[Debug] Args: ${JSON.stringify(functionArgs)}`));

            const func = functions[functionName];
            if (!func) {
                throw new Error(`Function ${functionName} not found.`);
            }

            // Replace chain & address
            functionArgs.chainName = CHAIN_NAME;
            functionArgs.account = signer.address;

            try {
                const funcReturn = await func(functionArgs, functionOptions);
                funcReturns.push(funcReturn);

                console.log(chalk.gray(`[Debug] Function returned ${funcReturn.success ? 'success' : 'failure'}`));
                if (!funcReturn.success) {
                    return funcReturn;
                } else {
                    console.log(chalk.gray(`[Debug] Function output: ${funcReturn.data}`));
                }

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
                throw new Error(`Error executing tool '${functionName}': ${error instanceof Error ? `${error.message}` : 'Unknown error'}`);
            }
        }
    }

    if (funcReturns.length === 0) {
        throw new Error('Could not identify any operations to perform.');
    }

    const finalMessage = messages[messages.length - 1];
    if (finalMessage.role !== 'assistant') {
        throw new Error('Final message is not an assistant message');
    }

    const assistantFinalComment = finalMessage.content;

    let combinedMessage = funcReturns
        .map((r, i) => {
            const toolName = messages.find((m) => m.role === 'tool' && m.content === r.data)?.name || 'Unknown Tool';
            const msg = chalk.underline.bold(`TOOL CALL ${i + 1}`) + `: ${toolName}`;
            return `${msg}\n${r.data}`;
        })
        .join('\n');

    if (assistantFinalComment) {
        combinedMessage += `\n${chalk.underline.bold('ASSISTANT FINAL COMMENT')}\n${assistantFinalComment}`;
    }

    return toResult(combinedMessage);
} 