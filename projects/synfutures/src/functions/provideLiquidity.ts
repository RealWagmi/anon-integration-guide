// functions/provideLiquidity.ts
import { Address } from "viem";
import { FunctionReturn, FunctionOptions, TransactionParams } from "../types";
import { toResult } from "../constants";
import { SynFuturesClient } from "../client";

/**
 * Parameters for providing liquidity
 */
export interface Props {
    chainName: string;          // Network name (e.g., 'BASE')
    tradingPair: string;        // Trading pair symbol (e.g., 'ETH-USDC')
    amount: string;             // Amount of base token to provide
    lowerTick: string;          // Lower price tick for liquidity range
    upperTick: string;          // Upper price tick for liquidity range
    useAutoRange?: boolean;     // Whether to use auto range based on volatility
    dynamicFeeThreshold?: string; // Threshold for dynamic fee adjustment
    account: `0x${string}`;     // User's wallet address
}

/**
 * Provides concentrated liquidity to a trading pair
 * 
 * @param props - The liquidity parameters including pair, amount, and price range
 * @param options - System tools for blockchain interactions
 * @returns Transaction result indicating success or failure
 */
export async function provideLiquidity(
    { chainName, tradingPair, amount, lowerTick, upperTick, useAutoRange = false, dynamicFeeThreshold = "0", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Get chain ID for BASE network
    const chainId = 8453; // BASE mainnet

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

        // Get transaction data for adding liquidity
        const { tx } = await client.addLiquidity({
            pair: tradingPair,
            amount,
            lowerTick: parseInt(lowerTick),
            upperTick: parseInt(upperTick),
            useAutoRange,
            dynamicFeeThreshold
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