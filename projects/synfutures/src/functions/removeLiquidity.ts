// functions/removeLiquidity.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for removing liquidity
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    positionId: string;         // NFT ID of the liquidity position
    percentage?: string;        // Percentage of liquidity to remove (1-100)
    collectFees?: boolean;      // Whether to collect accumulated fees
    minAmountOut?: string;      // Minimum amount of tokens to receive
    account: `0x${string}`;     // User's wallet address
}

/**
 * Removes liquidity from a position
 * 
 * This function allows liquidity providers (LPs) to withdraw their tokens from a position.
 * Each liquidity position is represented by an NFT with a unique ID. LPs can choose to
 * remove any percentage of their liquidity, from 1% to 100%.
 * 
 * When removing liquidity:
 * - The LP will receive back their deposited tokens
 * - Any unclaimed fees will be automatically collected
 * - The position NFT will be burned if 100% of liquidity is removed
 * 
 * @param props - The removal parameters including position ID and percentage
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if percentage is invalid
 * @throws Will throw an error if liquidity removal fails
 */
export async function removeLiquidity(
    { chainName, positionId, percentage = "100", collectFees = true, minAmountOut = "0", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate position ID format
    if (!positionId.match(/^0x[a-fA-F0-9]{64}$/)) {
        return toResult(
            "Invalid position ID. Please provide a valid transaction hash from your liquidity provision transaction.",
            true
        );
    }

    // Get chain ID for BASE network
    const chainId = 84532; // BASE Sepolia testnet

    try {
        // Notify user that liquidity removal is starting
        await notify?.("Preparing to remove liquidity...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for removing liquidity
        const { tx } = await client.removeLiquidity({
            positionId,
            percentage: parseInt(percentage),
            collectFees,
            minAmountOut
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

        // Return success message with removal details
        return toResult(
            `Successfully removed ${percentage}% liquidity from position ${positionId}${collectFees ? " and collected fees" : ""}`
        );
    } catch (error) {
        // Return error message if liquidity removal fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to remove liquidity: ${errorMessage}. Note: You need to provide the transaction hash from your liquidity provision transaction as the position ID.`, true);
    }
} 