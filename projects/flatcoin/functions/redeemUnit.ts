// functions/redeemUnit.ts
import { Address, encodeFunctionData } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName
} from "@heyanon/sdk";
import { ADDRESSES } from "../constants";
import { delayedOrderAbi } from "../abis/delayedOrder";
import { getKeeperFee } from "./getKeeperFee";

interface Props {
    chainName: string;      // Network name (BASE)
    unitAmount: string;     // Amount of UNIT tokens to redeem
    minAmountOut: string;   // Minimum rETH to receive after fees
    account: Address;       // User's wallet address
}

/**
 * Redeems UNIT tokens for the underlying rETH
 * @param props - The redemption parameters including UNIT amount and minimum output
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function redeemUnit(
    { chainName, unitAmount, minAmountOut, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to redeem UNIT tokens...");
        const provider = getProvider(chainId);
        
        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult("Failed to get keeper fee", true);
        }

        const transactions: TransactionParams[] = [];

        // Prepare redemption transaction
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceStableWithdraw",
                args: [
                    BigInt(unitAmount),    // Amount of UNIT to redeem
                    BigInt(minAmountOut),  // Minimum rETH to receive
                    keeperFee              // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        // Notify user of pending confirmation
        await notify("Waiting for transaction confirmation...");
        
        // Send transaction and wait for confirmation
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced UNIT redemption order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        // Handle any errors that occur during execution
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error redeeming UNIT: ${errorMessage}`, true);
    }
}

