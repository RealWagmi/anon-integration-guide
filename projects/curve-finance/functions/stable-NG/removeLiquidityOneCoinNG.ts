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

interface RemoveLiquidityOneCoinProps {
    chainName: string;
    poolAddress: Address;
    lpAmount: string;
    tokenIndex: number;
    minAmount: string;
    userAddress: Address;
}

/**
 * Removes liquidity from Curve StableSwapNG pool in a single token
 * @param props - The single-sided liquidity removal parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function removeLiquidityOneCoin(
    { chainName, poolAddress, lpAmount, tokenIndex, minAmount, userAddress }: RemoveLiquidityOneCoinProps,
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

        // Convert LP amount and minimum amount to Wei
        const lpAmountInWei = parseUnits(lpAmount, 18); // LP tokens typically have 18 decimals
        const minAmountInWei = parseUnits(minAmount, 18); // Adjust decimals based on token

        // Calculate expected output amount
        const expectedAmount = await provider.readContract({
            ...poolContract,
            functionName: "calc_withdraw_one_coin",
            args: [lpAmountInWei, BigInt(tokenIndex)]
        }) as bigint;

        // Verify minimum amount
        if (expectedAmount < minAmountInWei) {
            return toResult(`Expected output ${expectedAmount.toString()} is less than minimum required ${minAmountInWei.toString()}`, true);
        }

        await notify("Preparing single-sided remove liquidity transaction...");

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

        // Prepare remove liquidity one coin transaction
        const removeLiquidityTx: TransactionParams = {
            target: poolAddress,
            data: encodeFunctionData({
                abi: curveStableSwapNGAbi,
                functionName: "remove_liquidity_one_coin",
                args: [lpAmountInWei, BigInt(tokenIndex), minAmountInWei, userAddress]
            })
        };
        transactions.push(removeLiquidityTx);

        await notify("Waiting for transaction confirmation...");

        const result = await sendTransactions({ chainId, account: userAddress, transactions });
        const message = result.data[result.data.length - 1];

        return toResult(
            result.isMultisig
                ? message.message
                : `Successfully removed ${lpAmount} LP tokens for token index ${tokenIndex}. ${message.message}`
        );
    } catch (error) {
        return toResult(`Error removing liquidity: ${error.message}`, true);
    }
}