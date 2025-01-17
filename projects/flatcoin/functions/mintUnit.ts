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
    rethAmount: string;
    slippageTolerance?: string;
    account: Address;
}

/**
 * Deposits rETH to mint UNIT tokens
 * @param props - The deposit parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function mintUnit(
    { chainName, rethAmount, slippageTolerance = "0.25", account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify("Preparing to mint UNIT tokens...");
        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        // Cast addresses to the correct type
        const spender = ADDRESSES.DELAYED_ORDER as Address;
        const target = ADDRESSES.RETH_TOKEN as Address;

        // Get keeper fee from contract
        const keeperFee = await getKeeperFee(provider);

        // Calculate minimum amount out based on slippage
        const minAmountOut = calculateMinAmountOut(rethAmount, slippageTolerance);

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target,
                spender,
                amount: BigInt(rethAmount)
            },
            provider,
            transactions
        });

        // Prepare announce deposit transaction
        const tx: TransactionParams = {
            target: spender,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: "announceStableDeposit",
                args: [BigInt(rethAmount), minAmountOut, keeperFee]
            })
        };
        transactions.push(tx);

        await notify("Waiting for transaction confirmation...");
        
        // Send transactions
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully announced UNIT minting order. The order will be executable after the timeout period. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        return toResult(`Error announcing UNIT mint: ${error.message}`, true);
    }
}

// Helper function to get keeper fee
async function getKeeperFee(provider: any): Promise<bigint> {
    // Implementation needed - we should get this from the KeeperFee contract
    // ADDRESSES.KEEPER_FEE
    return 0n; // Placeholder
}

// Helper function to calculate minimum amount out based on slippage
function calculateMinAmountOut(amount: string, slippageTolerance: string): bigint {
    const amountBigInt = BigInt(amount);
    const slippageMultiplier = 1000n - (BigInt(parseFloat(slippageTolerance) * 10) * 100n);
    return (amountBigInt * slippageMultiplier) / 1000n;
}
