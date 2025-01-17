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

interface Props {
    chainName: string;
    unitAmount: string;
    minAmountOut: string;
    account: Address;
}

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
        const transactions: TransactionParams[] = [];

        // Get keeper fee
        const keeperFee = await getKeeperFee(provider);

        // Prepare redemption transaction
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceStableWithdraw",
                args: [
                    BigInt(unitAmount),
                    BigInt(minAmountOut),
                    keeperFee
                ]
            })
        };

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced UNIT redemption order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        return toResult(`Error redeeming UNIT: ${error.message}`, true);
    }
}

// Helper function to get keeper fee
async function getKeeperFee(provider: any): Promise<bigint> {
    // Implementation needed
    return 0n; // Placeholder
}