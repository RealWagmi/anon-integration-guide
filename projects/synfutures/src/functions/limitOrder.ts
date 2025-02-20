// functions/limitOrder.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for creating a limit order
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    side: "BUY" | "SELL";       // Order side - BUY to long, SELL to short
    amount: string;             // Amount of base token to trade
    price: string;              // Limit price in quote token
    slippageTolerance?: string; // Maximum slippage tolerance in percentage
    account: `0x${string}`;     // User's wallet address
}

/**
 * Places a limit order for a trading pair
 * 
 * A limit order is an order to buy or sell at a specific price or better.
 * Limit orders guarantee price but do not guarantee execution.
 */
export async function limitOrder(
    { chainName, tradingPair, side, amount, price, slippageTolerance = "0.5", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return toResult("Amount must be a positive number", true);
    }

    // Validate price
    if (!price) {
        return toResult("Price is required for limit orders", true);
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
        return toResult("Price must be a positive number", true);
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
        await notify?.("Preparing limit order...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for the limit order
        const { tx } = await client.createLimitOrder({
            pair: tradingPair,
            side,
            amount,
            price
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
            `Successfully placed ${side} limit order for ${amount} ${tradingPair} at ${price} USDC`
        );
    } catch (error) {
        // Return error message if order fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to place limit order: ${errorMessage}`, true);
    }
} 