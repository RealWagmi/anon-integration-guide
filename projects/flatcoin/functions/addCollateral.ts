// functions/addCollateral.ts
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

interface Props {
    chainName: string;
    positionId: string;
    additionalCollateral: string;
    account: Address;
}

export async function addCollateral(
    { chainName, positionId, additionalCollateral, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to add collateral...");
        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];  // Explicitly type the array

        // Get keeper fee
        const keeperFee = await getKeeperFee(provider);

        // Prepare transaction
        const tx = {
            target: ADDRESSES.DELAYED_ORDER,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceLeverageAdjust",
                args: [
                    BigInt(positionId),
                    BigInt(additionalCollateral),
                    0n, // No size adjustment
                    0n, // Fill price (will be determined at execution)
                    keeperFee
                ]
            })
        } as TransactionParams;  // Explicitly cast to TransactionParams

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced collateral addition order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        return toResult(`Error adding collateral: ${error.message}`, true);
    }
}

// Helper function to get keeper fee
async function getKeeperFee(provider: any): Promise<bigint> {
    // Implementation needed
    return 0n; // Placeholder
}
