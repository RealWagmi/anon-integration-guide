import { createPublicClient, http, createWalletClient, PublicClient, Chain, defineChain } from 'viem';
import { base, baseGoerli } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionReturn, toResult } from '@heyanon/sdk';
import { tools } from '../tools';
import * as functions from '../functions';
import { FunctionOptions, TransactionParams, TransactionReturnData, TransactionReturn } from '../types';
import { SynFuturesClient } from '../client';
import { getChainFromName } from '../constants';
import chalk from 'chalk';
import 'dotenv/config';

interface AskSynFuturesOptions {
    verbose?: boolean;
    notify?: (message: string) => Promise<void>;
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
    // Validate environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Setup notification handler
    const notify = options?.notify || (async (message: string) => 
        console.log(chalk.blue(`[Notification] ${message}`))
    );

    // Initialize blockchain clients
    const signer = privateKeyToAccount(`0x${privateKey}`);
    const isTestnet = process.env.RPC_URL?.includes('goerli') ?? true;
    const selectedChain = isTestnet ? baseGoerli : base;
    
    // Create a compatible chain configuration
    const chain = defineChain(selectedChain);
    
    const provider = createPublicClient({
        chain,
        transport: http(process.env.RPC_URL),
    }) as PublicClient;

    // Create wallet client for transactions
    const walletClient = createWalletClient({
        account: signer,
        chain,
        transport: http(process.env.RPC_URL),
    });

    // Setup function options with proper types
    const functionOptions: FunctionOptions = {
        getProvider: (_chainId: number): PublicClient => provider,
        sendTransactions: async ({ chainId, account, transactions }) => {
            const results: TransactionReturnData[] = [];
            
            // Log transaction intent
            if (options?.verbose) {
                console.log(chalk.gray('\nTransaction Details:'));
                console.log(chalk.gray(`Chain ID: ${chainId}`));
                console.log(chalk.gray(`Account: ${account}`));
                console.log(chalk.gray(`Transaction Count: ${transactions.length}`));
            }

            // Process each transaction
            for (const tx of transactions) {
                if (options?.verbose) {
                    console.log(chalk.gray('\nTransaction Data:'));
                    console.log(chalk.gray(`Target: ${tx.target}`));
                    console.log(chalk.gray(`Value: ${tx.value || '0'}`));
                    console.log(chalk.gray(`Data Length: ${tx.data.length} bytes`));
                }

                if (process.env.IS_TEST === 'true') {
                    // Simulate transaction in test mode
                    results.push({
                        hash: `0x${'0'.repeat(64)}` as `0x${string}`,
                        message: 'Test transaction simulated successfully'
                    });
                    continue;
                }

                try {
                    // Send actual transaction
                    const hash = await walletClient.sendTransaction({
                        to: tx.target,
                        data: tx.data,
                        value: BigInt(tx.value || '0'),
                    });

                    // Wait for confirmation
                    const receipt = await provider.waitForTransactionReceipt({ hash });
                    
                    results.push({
                        hash: receipt.transactionHash,
                        message: `Transaction confirmed with hash: ${receipt.transactionHash}`,
                    });
                } catch (error) {
                    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: true,
                data: results
            };
        },
        notify,
    };

    // Parse the natural language query and execute appropriate function
    try {
        // Log the query in verbose mode
        if (options?.verbose) {
            console.log(chalk.gray('\nProcessing Query:'), chalk.white(question));
        }

        // Extract key information from the query
        const words = question.toLowerCase().split(' ');
        
        // Determine the function to call based on keywords
        let result: FunctionReturn;
        
        if (words.includes('market') || (words.includes('buy') || words.includes('sell')) && !words.includes('limit')) {
            // Market Order
            const side = words.includes('sell') ? 'SELL' : 'BUY';
            const amountIndex = Math.max(words.indexOf('buy'), words.indexOf('sell')) + 1;
            const amount = words[amountIndex];
            
            result = await functions.marketOrder({
                chainName: process.env.CHAIN_NAME || 'BASE',
                tradingPair: process.env.TRADING_PAIR || 'ETH-USDC',
                side,
                amount,
                slippageTolerance: process.env.SLIPPAGE_TOLERANCE || '0.5',
                account: signer.address
            }, functionOptions);
        }
        else if (words.includes('limit')) {
            // Limit Order
            const side = words.includes('sell') ? 'SELL' : 'BUY';
            const amountIndex = Math.max(words.indexOf('buy'), words.indexOf('sell')) + 1;
            const amount = words[amountIndex];
            const priceIndex = words.indexOf('at') + 1;
            const price = words[priceIndex];
            
            result = await functions.limitOrder({
                chainName: process.env.CHAIN_NAME || 'BASE',
                tradingPair: process.env.TRADING_PAIR || 'ETH-USDC',
                side,
                amount,
                price,
                account: signer.address
            }, functionOptions);
        }
        else if (words.includes('leverage') || (words.includes('position') && !words.includes('liquidity'))) {
            // Position
            const side = words.includes('short') ? 'SHORT' : 'LONG';
            
            // Find leverage value (e.g., "2x" or "2")
            const leverageMatch = question.match(/(\d+)x?\s+leverage/);
            if (!leverageMatch) {
                return toResult('Please specify leverage (e.g., "2x leverage" or "2 leverage")', true);
            }
            const leverage = leverageMatch[1];

            // Find margin amount
            const marginMatch = question.match(/(\d+\.?\d*)\s+ETH\s+as\s+margin/);
            if (!marginMatch) {
                return toResult('Please specify margin amount (e.g., "0.1 ETH as margin")', true);
            }
            const margin = marginMatch[1];
            
            result = await functions.openPosition({
                chainName: process.env.CHAIN_NAME || 'BASE',
                tradingPair: process.env.TRADING_PAIR || 'ETH-USDC',
                side,
                leverage,
                margin,
                account: signer.address
            }, functionOptions);
        }
        else if (words.includes('liquidity')) {
            if (words.includes('provide') || words.includes('add')) {
                // Provide Liquidity
                const amountIndex = words.indexOf('with') + 1;
                const amount = words[amountIndex];
                const lowerIndex = words.indexOf('between') + 1;
                const upperIndex = words.indexOf('-') + 1;
                const lowerTick = words[lowerIndex];
                const upperTick = words[upperIndex];
                
                result = await functions.provideLiquidity({
                    chainName: process.env.CHAIN_NAME || 'BASE',
                    tradingPair: process.env.TRADING_PAIR || 'ETH-USDC',
                    amount,
                    lowerTick,
                    upperTick,
                    account: signer.address
                }, functionOptions);
            } else if (words.includes('remove')) {
                // Remove Liquidity
                if (options?.verbose) {
                    console.log(chalk.gray('\nParsing remove liquidity command:'));
                    console.log(chalk.gray('Words:', words.join(', ')));
                }

                // Find position ID - look for pattern #123 or position 123
                const positionMatch = question.match(/#(\d+)/) || question.match(/position\s+(\d+)/);
                if (!positionMatch) {
                    return toResult('Please specify a position ID (e.g., #123 or position 123)', true);
                }
                const positionId = positionMatch[1];

                // Find percentage - look for number followed by % or just the number before "liquidity"
                const percentageMatch = question.match(/(\d+)(?:\s*%)?(?=\s+liquidity)/);
                if (!percentageMatch) {
                    return toResult('Please specify a percentage to remove (e.g., "50%" or "50")', true);
                }
                const percentage = percentageMatch[1];

                if (options?.verbose) {
                    console.log(chalk.gray(`Position ID: ${positionId}`));
                    console.log(chalk.gray(`Percentage: ${percentage}`));
                }

                try {
                    const client = new SynFuturesClient({
                        chainId: chain.id,
                        provider,
                        signer: signer.address
                    });

                    // Get transaction data for removing liquidity
                    const { tx } = await client.removeLiquidity({
                        positionId,
                        percentage: parseFloat(percentage) / 100
                    });

                    // Prepare transaction parameters
                    const transactions: TransactionParams[] = [{
                        target: tx.data.slice(0, 42) as `0x${string}`,
                        data: tx.data as `0x${string}`,
                        value: tx.value || "0"
                    }];

                    // Send transaction
                    await notify("Removing liquidity...");
                    const txResult = await functionOptions.sendTransactions({
                        chainId: chain.id,
                        account: signer.address,
                        transactions
                    });

                    result = toResult(`Successfully removed ${percentage}% liquidity from position ${positionId}`);
                } catch (error) {
                    if (options?.verbose) {
                        console.error('Error details:', error);
                    }
                    return toResult(`Failed to remove liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
                }
            } else {
                return toResult('Could not understand the liquidity command. Please specify "provide" or "remove".', true);
            }
        }
        else {
            return toResult('Could not understand the command. Please try again with a more specific request.', true);
        }

        return result;
    } catch (error) {
        // Log detailed error information in verbose mode
        if (options?.verbose) {
            console.error(chalk.red('\nError Details:'));
            if (error instanceof Error) {
                console.error(chalk.gray('Message:', error.message));
                console.error(chalk.gray('Stack:', error.stack));
            } else {
                console.error(chalk.gray('Unknown error:', error));
            }
        }
        return toResult(`Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
} 