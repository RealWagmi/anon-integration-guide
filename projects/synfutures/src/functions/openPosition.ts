// functions/openPosition.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for opening a leveraged position
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    side: "LONG" | "SHORT";     // Position side - LONG to buy, SHORT to sell
    leverage: string;           // Leverage multiplier (e.g., "2", "5", "10", "15", "25")
    margin: string;             // Margin amount in base token
    slippageTolerance?: string; // Maximum slippage tolerance in percentage
    account: `0x${string}`;     // User's wallet address
}

/**
 * Opens a leveraged position for a trading pair
 */
export async function openPosition(
    { chainName, tradingPair, side, leverage, margin, slippageTolerance = "0.5", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate margin amount
    if (!margin) {
        return toResult("Margin amount is required", true);
    }
    const numericMargin = parseFloat(margin);
    if (isNaN(numericMargin) || numericMargin <= 0) {
        return toResult("Margin amount must be a positive number", true);
    }

    // Validate leverage
    const supportedLeverage = ["2", "5", "10", "15", "25"];
    if (!leverage || !supportedLeverage.includes(leverage)) {
        return toResult(`Invalid leverage. Supported values: ${supportedLeverage.map(l => l + 'x').join(', ')}`, true);
    }

    // Validate trading pair
    const supportedPairs = ["ETH-USDC", "BTC-USDC"]; // Add your supported pairs here
    if (!supportedPairs.includes(tradingPair)) {
        return toResult(`Unsupported trading pair: ${tradingPair}. Supported pairs: ${supportedPairs.join(", ")}`, true);
    }

    // Validate slippage tolerance
    const slippageValue = parseFloat(slippageTolerance);
    if (isNaN(slippageValue) || slippageValue < 0 || slippageValue > 100) {
        return toResult("Slippage tolerance must be between 0 and 100", true);
    }

    // Get chain ID for BASE network
    const chainId = 8453; // BASE mainnet

    try {
        // Notify user that position opening is starting
        await notify?.("Preparing to open position...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for opening the position
        const { tx } = await client.createPosition({
            pair: tradingPair,
            side,
            leverage,
            margin
        });

        // Prepare transaction parameters
        const transactions: TransactionParams[] = [{
            target: tx.to,
            data: tx.data,
            value: BigInt(tx.value || 0)
        }];

        // Notify user that transaction is being processed
        await notify?.("Waiting for transaction confirmation...");
        
        // Send transaction and wait for confirmation
        const result = await sendTransactions({ chainId, account, transactions });

        // Return success message with position details
        return toResult(
            `Successfully opened ${side} position with ${leverage}x leverage using ${margin} ${tradingPair.split('-')[0]} as margin`
        );
    } catch (error) {
        // Return error message if position opening fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to open position: ${errorMessage}`, true);
    }
} 