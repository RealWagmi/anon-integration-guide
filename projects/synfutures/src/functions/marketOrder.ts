import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for creating a market order
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    side: "BUY" | "SELL";       // Order side - BUY to long, SELL to short
    amount: string;             // Amount of base token to trade
    slippageTolerance?: string; // Maximum slippage tolerance in percentage
    account: `0x${string}`;     // User's wallet address
}

/**
 * Executes a market order for a trading pair
 * 
 * A market order is an order to buy or sell immediately at the best available price.
 * Market orders guarantee execution but do not guarantee a specific price.
 * 
 * @param props - The order parameters including pair, side, and amount
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if order creation fails
 */
export async function marketOrder(
    { chainName, tradingPair, side, amount, slippageTolerance = "0.5", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return toResult("Amount must be a positive number", true);
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
        // Notify user that order preparation is starting
        await notify?.("Preparing market order...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for the market order
        const { tx } = await client.createMarketOrder({
            pair: tradingPair,
            side,
            amount,
            slippage: slippageValue / 100
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

        // Return success message with order details
        return toResult(
            `Successfully executed ${side} market order for ${amount} ${tradingPair}`
        );
    } catch (error) {
        // Return error message if order fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to execute market order: ${errorMessage}`, true);
    }
} 