// functions/adjustRange.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { getChainFromName, toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for adjusting a liquidity position's price range
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    positionId: string;         // NFT ID of the liquidity position
    newLowerTick: string;       // New lower price tick for liquidity range
    newUpperTick: string;       // New upper price tick for liquidity range
    account: `0x${string}`;     // User's wallet address
}

/**
 * Adjusts the price range of an existing liquidity position
 * 
 * This function allows liquidity providers (LPs) to modify their position's price range
 * without removing and re-adding liquidity. This is useful for responding to market
 * movements and optimizing fee earnings.
 * 
 * The adjustment process:
 * 1. Automatically collects any earned fees
 * 2. Moves liquidity to the new price range
 * 3. Updates the position NFT with new parameters
 * 
 * @param props - The adjustment parameters including position ID and new price range
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if new tick range is invalid
 * @throws Will throw an error if range adjustment fails
 */
export async function adjustRange(
    { chainName, positionId, newLowerTick, newUpperTick, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

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

        // Convert tick strings to numbers
        const tickLower = parseInt(newLowerTick);
        const tickUpper = parseInt(newUpperTick);

        // Validate tick range
        if (tickLower >= tickUpper) {
            return toResult("Lower tick must be less than upper tick", true);
        }

        // Get transaction data for adjusting the range
        const { tx } = await client.adjustLiquidityRange({
            positionId,
            newLowerTick: tickLower,
            newUpperTick: tickUpper
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

        // Return success message with adjustment details
        return toResult(
            `Successfully adjusted position ${positionId} range to ${newLowerTick}-${newUpperTick}`
        );
    } catch (error) {
        // Return error message if range adjustment fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to adjust range: ${errorMessage}`, true);
    }
} 