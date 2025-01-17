// functions/openLongPosition.ts
import { Address, encodeFunctionData } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName,
    checkToApprove
} from "@heyanon/sdk";
import { ADDRESSES } from "../constants";
import { delayedOrderAbi } from "../abis/delayedOrder";

interface Props {
    chainName: string;
    marginAmount: string;
    leverage: string;
    account: Address;
}

export async function openLongPosition(
    { chainName, marginAmount, leverage, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult("Wallet not connected", true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to open long position...");
        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        const marginAmountBigInt = BigInt(marginAmount);

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target: ADDRESSES.RETH_TOKEN as `0x${string}`,
                spender: ADDRESSES.DELAYED_ORDER as `0x${string}`,
                amount: marginAmountBigInt  // Now using BigInt
            },
            provider,
            transactions
        });

        // Get keeper fee
        const keeperFee = await getKeeperFee(provider);

        // Calculate additional size based on leverage
        const additionalSize = marginAmountBigInt * (BigInt(leverage) - 1n);
        const maxFillPrice = 0n; // Will be determined at execution

        // Prepare open position transaction
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceLeverageOpen",
                args: [
                    marginAmountBigInt,
                    additionalSize,
                    maxFillPrice,
                    keeperFee
                ]
            })
        };

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced leverage position order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        return toResult(`Error opening position: ${error.message}`, true);
    }
}

// Helper function to get keeper fee
async function getKeeperFee(provider: any): Promise<bigint> {
    // Implementation needed
    return 0n; // Placeholder
}