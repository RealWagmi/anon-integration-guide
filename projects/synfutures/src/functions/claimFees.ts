import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for claiming fees
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    positionId: string;         // NFT ID of the liquidity position
    reinvest?: boolean;         // Whether to reinvest claimed fees
    claimAll?: boolean;         // Whether to claim from all positions
    account: `0x${string}`;     // User's wallet address
}

/**
 * Claims accumulated trading fees from a liquidity position
 * 
 * @param props - The claim parameters including position ID and options
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 */
export async function claimFees(
    { chainName, positionId, reinvest = false, claimAll = false, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Get chain ID for BASE network
    const chainId = 8453; // BASE mainnet

    try {
        // Notify user that fee claiming is starting
        await notify?.("Preparing to claim fees...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for claiming fees
        const { tx } = await client.claimFees({
            positionId,
            reinvest,
            claimAll
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

        // Return success message with claim details
        return toResult(
            `Successfully claimed fees from position #${positionId}${reinvest ? " and reinvested" : ""}${claimAll ? " (including all positions)" : ""}`
        );
    } catch (error) {
        // Return error message if fee claiming fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to claim fees: ${errorMessage}`, true);
    }
} 