// functions/adjustRange.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for adjusting liquidity range
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    positionId: string;         // NFT ID of the liquidity position
    newLowerTick: string;       // New lower price tick for liquidity range
    newUpperTick: string;       // New upper price tick for liquidity range
    adjustmentStrategy?: "SHIFT" | "WIDEN" | "NARROW"; // Strategy for range adjustment
    rebalanceTokens?: boolean;  // Whether to rebalance token amounts
    account: `0x${string}`;     // User's wallet address
}

/**
 * Adjusts the price range of a liquidity position
 * 
 * @param props - The adjustment parameters including position ID and new range
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 */
export async function adjustRange(
    { chainName, positionId, newLowerTick, newUpperTick, adjustmentStrategy = "SHIFT", rebalanceTokens = false, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Get chain ID for BASE network
    const chainId = 8453; // BASE mainnet

    try {
        // Notify user that range adjustment is starting
        await notify?.("Preparing to adjust liquidity range...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for adjusting range
        const { tx } = await client.adjustLiquidityRange({
            positionId,
            newLowerTick: parseInt(newLowerTick),
            newUpperTick: parseInt(newUpperTick),
            adjustmentStrategy,
            rebalanceTokens
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

        // Return success message with adjustment details
        return toResult(
            `Successfully adjusted position #${positionId} range to ${newLowerTick}-${newUpperTick} using ${adjustmentStrategy} strategy`
        );
    } catch (error) {
        // Return error message if range adjustment fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to adjust range: ${errorMessage}`, true);
    }
} 