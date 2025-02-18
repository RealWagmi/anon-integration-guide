import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { getChainFromName, toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for claiming accumulated trading fees
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    positionId: string;         // NFT ID of the liquidity position
    account: `0x${string}`;     // User's wallet address
}

/**
 * Claims accumulated trading fees from a liquidity position
 * 
 * This function allows liquidity providers (LPs) to collect their earned trading fees.
 * Fees are accumulated when trades occur within the position's price range.
 * 
 * However, LPs can also manually collect fees using this function without modifying
 * their position.
 * 
 * @param props - The claim parameters including position ID
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if fee collection fails
 */
export async function claimFees(
    { chainName, positionId, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        // Notify user that fee collection is starting
        await notify?.("Preparing to claim fees...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Get transaction data for collecting fees
        const { tx } = await client.claimFees({
            positionId
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

        // Return success message with claim details
        return toResult(
            `Successfully claimed fees from position ${positionId}`
        );
    } catch (error) {
        // Return error message if fee collection fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to claim fees: ${errorMessage}`, true);
    }
} 