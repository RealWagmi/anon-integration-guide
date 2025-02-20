import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { tools, Tool } from './tools';
import * as functions from '../functions';

export interface AskFlatcoinProps {
    question: string;
    chainName: string;
    account: Address;
    options: FunctionOptions;
    mockFunctions?: Record<string, Function>; // Optional mock functions for testing
}

export async function askFlatcoin({ 
    question, 
    chainName, 
    account, 
    options,
    mockFunctions 
}: AskFlatcoinProps): Promise<FunctionReturn> {
    // For Flatcoin, we only support BASE chain
    if (chainName.toUpperCase() !== 'BASE') {
        return toResult('Flatcoin is only available on BASE chain', true);
    }

    // Find matching tool
    const matchedTool = tools.find((tool: Tool) => {
        const keywords = tool.keywords.map((k: string) => k.toLowerCase());
        return keywords.some((keyword: string) => question.toLowerCase().includes(keyword));
    });

    if (!matchedTool) {
        return toResult(
            "I couldn't find a relevant tool to help with your question. Here are some things I can help with:\n" +
            "- Minting UNIT tokens with rETH\n" +
            "- Redeeming UNIT tokens for rETH\n" +
            "- Opening leveraged positions\n" +
            "- Adding collateral to positions\n" +
            "- Closing positions",
            true
        );
    }

    // Extract arguments based on tool's pattern
    const args = matchedTool.extractArgs(question);
    if (!args) {
        return toResult(
            `I understand you want to ${matchedTool.description}, but I couldn't extract the necessary information. ${matchedTool.example}`,
            true
        );
    }

    // Validate arguments if validation function exists
    if (matchedTool.validateArgs) {
        const validationError = matchedTool.validateArgs(args);
        if (validationError) {
            return toResult(validationError, true);
        }
    }

    try {
        // Use mock functions if provided, otherwise use real functions
        const functionSet = mockFunctions || functions;
        const func = functionSet[matchedTool.name as keyof typeof functions];
        if (!func) {
            return toResult(`Function ${matchedTool.name} not found`, true);
        }

        await options.notify?.(`Executing ${matchedTool.description}...`);
        
        // Call the function with the extracted args and common parameters
        return await func({
            chainName,
            account,
            ...args
        } as any, options);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return toResult(`Error executing ${matchedTool.name}: ${errorMessage}`, true);
    }
} 