// functions/swap.ts
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

interface SwapProps {
    chainName: string;
    poolAddress: Address;
    fromToken: number;
    toToken: number;
    amount: string;
    slippage: string;
    userAddress: Address;
}

/**
 * Swaps tokens using Curve StableSwapNG pool
 * @param props - The swap parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function swap(
    { chainName, poolAddress, fromToken, toToken, amount, slippage, userAddress }: SwapProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!userAddress) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    try {
        // Get pool contract
        const poolContract = {
            address: poolAddress,
            abi: curveStableSwapNGAbi
        };

        // Get input token info
        const inputTokenAddress = await provider.readContract({
            ...poolContract,
            functionName: "coins",
            args: [BigInt(fromToken)]
        }) as Address;

        // Calculate expected output
        const amountIn = parseUnits(amount, 18); // Adjust decimals based on token
        const expectedOut = await provider.readContract({
            ...poolContract,
            functionName: "get_dy",
            args: [BigInt(fromToken), BigInt(toToken), amountIn]
        }) as bigint;

        // Calculate minimum output with slippage
        const slippageBps = parseUnits(slippage, 2);
        const minOut = (expectedOut * (10000n - slippageBps)) / 10000n;

        await notify("Preparing swap transaction...");

        const transactions: TransactionParams[] = [];

        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account: userAddress,
                target: inputTokenAddress,
                spender: poolAddress,
                amount: amountIn
            },
            provider,
            transactions
        });

        // Prepare swap transaction
        const swapTx: TransactionParams = {
            target: poolAddress,
            data: encodeFunctionData({
                abi: curveStableSwapNGAbi,
                functionName: "exchange",
                args: [BigInt(fromToken), BigInt(toToken), amountIn, minOut, userAddress]
            })
        };
        transactions.push(swapTx);

        await notify("Waiting for transaction confirmation...");

        // Send transactions
        const result = await sendTransactions({ chainId, account: userAddress, transactions });
        const message = result.data[result.data.length - 1];

        return toResult(
            result.isMultisig
                ? message.message
                : `Successfully swapped ${amount} tokens. ${message.message}`
        );
    } catch (error) {
        return toResult(`Error performing swap: ${error.message}`, true);
    }
}