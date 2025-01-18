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
import { getKeeperFee } from "./getKeeperFee";

// Define the props interface
interface Props {
    chainName: string;          // Network name (BASE)
    positionId: string;         // NFT ID of the leverage position
    additionalCollateral: string; // Amount of rETH to add as collateral
    account: Address;           // User's wallet address
}

/**
 * Adds additional collateral to an existing leverage position
 * @param props - The position parameters and collateral amount
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function addCollateral(
    { chainName, positionId, additionalCollateral, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult("Wallet not connected", true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to add collateral...");
        const provider = getProvider(chainId);
        
        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult("Failed to get keeper fee", true);
        }

        const transactions: TransactionParams[] = [];

        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceLeverageAdjust",
                args: [
                    BigInt(positionId),
                    BigInt(additionalCollateral),
                    0n,
                    0n,
                    keeperFee
                ]
            })
        };

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced collateral addition order. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error adding collateral: ${errorMessage}`, true);
    }
}

