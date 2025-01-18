// functions/closePosition.ts
import { Address, encodeFunctionData } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName
} from "@heyanon/sdk";
import { ADDRESSES } from "../constants";
import { leverageModuleAbi } from "../abis/leverageModule";
import { getKeeperFee } from "./getKeeperFee";

interface Props {
    chainName: string;      // Network name (BASE)
    positionId: string;     // NFT ID of the leverage position
    minFillPrice: string;   // Minimum acceptable price for closing position
    account: Address;       // User's wallet address
}

/**
 * Closes an existing leveraged position and withdraws collateral
 * @param props - The position parameters including minimum fill price
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function closePosition(
    { chainName, positionId, minFillPrice, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        // Notify user of transaction preparation
        await notify("Preparing to close position...");
        const provider = getProvider(chainId);

        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult("Failed to get keeper fee", true);
        }

        const transactions: TransactionParams[] = [];

        // Prepare transaction to close position
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: "announceLeverageClose",
                args: [
                    BigInt(positionId),          // Position NFT ID
                    BigInt(minFillPrice),        // Minimum acceptable price
                    keeperFee                    // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        // Notify user of pending confirmation
        await notify("Waiting for transaction confirmation...");
        
        // Send transaction and wait for confirmation
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced position close order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        // Handle any errors that occur during execution
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error closing position: ${errorMessage}`, true);
    }
}

