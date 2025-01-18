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
import { getKeeperFee } from "./getKeeperFee";

interface Props {
    chainName: string;      // Network name (BASE)
    marginAmount: string;   // Amount of rETH to use as collateral
    leverage: string;       // Leverage multiplier (2x, 5x, 10x, 15x, 25x)
    account: Address;       // User's wallet address
}

/**
 * Opens a leveraged long position using rETH as collateral
 * @param props - The position parameters including margin and leverage
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function openLongPosition(
    { chainName, marginAmount, leverage, account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    // Validate leverage options
    const allowedLeverage = ["2", "5", "10", "15", "25"];
    if (!allowedLeverage.includes(leverage)) {
        return toResult(`Invalid leverage value. Allowed values: ${allowedLeverage.join(", ")}`, true);
    }

    try {
        await notify("Preparing to open long position...");
        const provider = getProvider(chainId);

        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult("Failed to get keeper fee", true);
        }

        const transactions: TransactionParams[] = [];
        const marginAmountBigInt = BigInt(marginAmount);

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target: ADDRESSES.RETH_TOKEN as `0x${string}`,
                spender: ADDRESSES.DELAYED_ORDER as `0x${string}`,
                amount: marginAmountBigInt
            },
            provider,
            transactions
        });

        // Calculate position size based on leverage
        const additionalSize = marginAmountBigInt * (BigInt(leverage) - 1n);
        const maxFillPrice = 0n; // Price will be determined at execution time

        // Prepare transaction to open position
        const tx: TransactionParams = {
            target: ADDRESSES.DELAYED_ORDER as `0x${string}`,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceLeverageOpen",
                args: [
                    marginAmountBigInt,  // Initial margin amount
                    additionalSize,      // Additional borrowed amount based on leverage
                    maxFillPrice,        // Maximum acceptable entry price
                    keeperFee           // Fee for keeper execution
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
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error opening position: ${errorMessage}`, true);
    }
}

