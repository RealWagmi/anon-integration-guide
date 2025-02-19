// functions/limitOrder.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { getChainFromName, toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for creating a limit order
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    side: "BUY" | "SELL";       // Order side - BUY to long, SELL to short
    amount: string;             // Amount of base token to trade
    price: string;              // Limit price for the order
    account: `0x${string}`;     // User's wallet address
}

/**
 * Places a limit order for a trading pair
 * 
 * A limit order is an order to buy or sell at a specific price or better.
 * Limit orders guarantee price but do not guarantee execution.
 */
export async function limitOrder(
    { chainName, tradingPair, side, amount, price, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

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
            target: tx.data.slice(0, 42) as `0x${string}`, // Extract target address from tx data
            data: tx.data as `0x${string}`,
            value: tx.value || "0"
        }];

        // Notify user that transaction is being processed
        await notify?.("Waiting for transaction confirmation...");
        
        // Send transaction and wait for confirmation
        const result = await sendTransactions({ chainId, account, transactions });

        // Return success message with order details
        return toResult(
            `Successfully placed ${side} limit order for ${amount} ${tradingPair} at ${price}`
        );
    } catch (error) {
        // Return error message if order fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to place limit order: ${errorMessage}`, true);
    }
} 