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

interface Props {
    chainName: string;
    positionId: string;
    minFillPrice: string;
    account: Address;
}

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
        await notify("Preparing to close position...");
        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        // Get keeper fee
        const keeperFee = await getKeeperFee(provider);

        // Prepare transaction
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`, // Cast to correct hex format
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: "announceLeverageClose",
                args: [
                    BigInt(positionId),
                    BigInt(minFillPrice),
                    keeperFee
                ]
            })
        };

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced position close order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        return toResult(`Error closing position: ${error.message}`, true);
    }
}

// Helper function to get keeper fee
async function getKeeperFee(provider: any): Promise<bigint> {
    // Implementation needed
    return 0n; // Placeholder
}