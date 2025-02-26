import { Address, encodeFunctionData, parseUnits } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName,
    checkToApprove
} from "@heyanon/sdk";
import { supportedChains } from "../../constants";
import { curveStableSwapNGAbi } from "../../abis/stable-swap-ng";

interface RemoveLiquidityProps {
    chainName: string;
    poolAddress: Address;
    lpAmount: string;
    minAmounts: string[];
    userAddress: Address;
}

/**
 * Removes liquidity from Curve StableSwapNG pool
 * @param props - The liquidity removal parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function removeLiquidity(
    { chainName, poolAddress, lpAmount, minAmounts, userAddress }: RemoveLiquidityProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!userAddress) return toResult("Wallet not connected", true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    try {
        const poolContract = {
            address: poolAddress,
            abi: curveStableSwapNGAbi
        };

        // Convert LP amount to Wei
        const lpAmountInWei = parseUnits(lpAmount, 18); // LP tokens typically have 18 decimals

        // Convert minimum amounts to Wei
        const minAmountsInWei = minAmounts.map(amount => parseUnits(amount, 18)); // Adjust decimals based on tokens

        await notify("Preparing remove liquidity transaction...");

        const transactions: TransactionParams[] = [];

        // Check and prepare LP token approval if needed
        await checkToApprove({
            args: {
                account: userAddress,
                target: poolAddress, // LP token address is the pool address
                spender: poolAddress,
                amount: lpAmountInWei
            },
            provider,
            transactions
        });

        // Prepare remove liquidity transaction
        const removeLiquidityTx: TransactionParams = {
            target: poolAddress,
            data: encodeFunctionData({
                abi: curveStableSwapNGAbi,
                functionName: "remove_liquidity",
                args: [lpAmountInWei, minAmountsInWei, userAddress]
            })
        };
        transactions.push(removeLiquidityTx);

        await notify("Waiting for transaction confirmation...");

        const result = await sendTransactions({ chainId, account: userAddress, transactions });
        const message = result.data[result.data.length - 1];

        return toResult(
            result.isMultisig
                ? message.message
                : `Successfully removed ${lpAmount} LP tokens. ${message.message}`
        );
    } catch (error) {
        return toResult(`Error removing liquidity: ${error.message}`, true);
    }
}