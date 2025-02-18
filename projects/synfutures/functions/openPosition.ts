// functions/openPosition.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { getChainFromName, toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for opening a leveraged position
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    side: "LONG" | "SHORT";     // Position side - LONG to buy, SHORT to sell
    leverage: string;           // Leverage multiplier (e.g., "2", "5", "10")
    margin: string;             // Amount of margin collateral to use
    account: `0x${string}`;     // User's wallet address
}

/**
 * Opens a new leveraged position in a trading pair
 * 
 * This function allows traders to open leveraged positions using the SynFutures protocol.
 * Leveraged trading amplifies both potential gains and losses by using borrowed funds.
 * 
 * Key aspects of leveraged positions:
 * - Margin: The collateral required to open and maintain the position
 * - Leverage: The multiplier that determines the position size relative to margin
 * - Liquidation: Positions can be liquidated if margin ratio falls below threshold
 * 
 * @param props - The position parameters including pair, side, leverage, and margin
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if leverage is invalid
 * @throws Will throw an error if position creation fails
 */
export async function openPosition(
    { chainName, tradingPair, side, leverage, margin, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    // Validate leverage
    const validLeverages = ["2", "5", "10", "15", "25"];
    if (!validLeverages.includes(leverage)) {
        return toResult(`Invalid leverage. Must be one of: ${validLeverages.join(", ")}`, true);
    }

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

        // Convert side to market order side
        const orderSide = side === "LONG" ? "BUY" : "SELL";

        // Calculate position size based on margin and leverage
        const positionSize = (parseFloat(margin) * parseFloat(leverage)).toString();

        // Get transaction data for market order to open position
        const { tx } = await client.createMarketOrder({
            pair: tradingPair,
            side: orderSide,
            amount: positionSize,
            slippage: 0.5 // Default slippage tolerance
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

        // Return success message with position details
        return toResult(
            `Successfully opened ${side} position in ${tradingPair} with ${leverage}x leverage using ${margin} margin`
        );
    } catch (error) {
        // Return error message if position creation fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to open position: ${errorMessage}`, true);
    }
} 