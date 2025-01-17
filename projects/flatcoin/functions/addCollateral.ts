import {
    FunctionReturn,
    FunctionOptions,
    getChainFromName,
    toResult,
    checkToApprove,
    TransactionParams,
} from "@heyanon/sdk";
import { Address, encodeFunctionData } from "viem";
import { ADDRESSES } from "../constants";
import { leverageModuleAbi } from "../abis/leverageModule";

interface Props {
    chainName: string;
    positionId: string;
    additionalCollateral: string;
    account: Address;
}

/**
 * Adds collateral to an existing leverage position
 * @param props - The input parameters
 * @param options - Function tools for interacting with blockchain
 * @returns Transaction result
 */
export async function addCollateral(
    { chainName, positionId, additionalCollateral, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate account
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to add collateral...");
        const provider = getProvider(chainId);
        const transactions = [];

        // Check and approve additional collateral if needed
        await checkToApprove({
            args: {
                account,
                target: ADDRESSES.LEVERAGE_MODULE as Address,
                spender: ADDRESSES.LEVERAGE_MODULE as Address,
                amount: BigInt(additionalCollateral),
            },
            provider,
            transactions
        });

        // Prepare add collateral transaction
        const tx = {
            target: ADDRESSES.LEVERAGE_MODULE as Address,
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: "addCollateral",
                args: [BigInt(positionId), BigInt(additionalCollateral)],
            }),
        };

        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        const result = await sendTransactions({ chainId, account, transactions });

        return toResult(
            `Successfully added collateral. Transaction Hash: ${result.data[result.data.length - 1].hash}`
        );
    } catch (error) {
        return toResult(`Error adding collateral: ${error.message}`, true);
    }
}
