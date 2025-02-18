// functions/provideLiquidity.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { getChainFromName, toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for providing liquidity to a trading pair
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    amount: string;             // Amount of tokens to provide as liquidity
    lowerTick: string;          // Lower price tick for liquidity range
    upperTick: string;          // Upper price tick for liquidity range
    account: `0x${string}`;     // User's wallet address
}

/**
 * Provides liquidity to a trading pair within a specified price range
 * 
 * This function allows users to become liquidity providers (LPs) by depositing tokens
 * within a specific price range. LPs earn fees from trades that occur within their
 * provided range.
 * 
 * The price range is specified using ticks, which are discrete price points in the AMM.
 * Liquidity is only active when the current price is within the specified range.
 * 
 * @param props - The liquidity parameters including pair, amount, and price range
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 * 
 * @throws Will throw an error if wallet is not connected
 * @throws Will throw an error if chain is not supported
 * @throws Will throw an error if liquidity provision fails
 */
export async function provideLiquidity(
    { chainName, tradingPair, amount, lowerTick, upperTick, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        // Notify user that liquidity provision is starting
        await notify?.("Preparing to provide liquidity...");
        const provider = getProvider(chainId);

        // Initialize SynFutures client
        const client = new SynFuturesClient({
            chainId,
            provider,
            signer: account
        });

        // Convert tick strings to numbers
        const tickLower = parseInt(lowerTick);
        const tickUpper = parseInt(upperTick);

        // Validate tick range
        if (tickLower >= tickUpper) {
            return toResult("Lower tick must be less than upper tick", true);
        }

        // Get transaction data for adding liquidity
        const { tx } = await client.addLiquidity({
            pair: tradingPair,
            amount,
            lowerTick: tickLower,
            upperTick: tickUpper
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

        // Return success message with liquidity details
        return toResult(
            `Successfully provided ${amount} liquidity to ${tradingPair} between ticks ${lowerTick}-${upperTick}`
        );
    } catch (error) {
        // Return error message if liquidity provision fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Failed to provide liquidity: ${errorMessage}`, true);
    }
} 