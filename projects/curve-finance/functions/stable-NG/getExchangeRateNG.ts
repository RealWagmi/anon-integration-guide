import { Address, formatUnits, parseUnits } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains } from "../../constants";
import { curveStableSwapNGAbi } from "../../abis/stable-swap-ng";

interface GetExchangeRateProps {
    chainName: string;
    poolAddress: Address;
    fromToken: number;
    toToken: number;
    amount: string;
}

/**
 * Gets the exchange rate between two tokens in a Curve StableSwapNG pool
 * @param props - Query parameters
 * @param tools - System tools for blockchain interactions
 * @returns The expected output amount and exchange rate
 */
export async function getExchangeRate(
    { chainName, poolAddress, fromToken, toToken, amount }: GetExchangeRateProps,
    { getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
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

        // Convert input amount to Wei
        const amountInWei = parseUnits(amount, 18); // Using 18 decimals as base, adjust if needed

        // Get expected output amount
        const expectedOutput = await provider.readContract({
            ...poolContract,
            functionName: "get_dy",
            args: [BigInt(fromToken), BigInt(toToken), amountInWei]
        }) as bigint;

        // Get current fee for the swap
        const fee = await provider.readContract({
            ...poolContract,
            functionName: "dynamic_fee",
            args: [BigInt(fromToken), BigInt(toToken)]
        }) as bigint;

        // Format output amount (18 decimals)
        const formattedOutput = formatUnits(expectedOutput, 18);
        const exchangeRate = Number(formattedOutput) / Number(amount);
        const formattedFee = formatUnits(fee, 10); // Fee is in bps (10 decimals)

        return toResult(
            JSON.stringify({
                inputAmount: amount,
                expectedOutput: formattedOutput,
                exchangeRate: exchangeRate.toFixed(6),
                fee: formattedFee,
                fromTokenIndex: fromToken,
                toTokenIndex: toToken,
                description: "Exchange rate and expected output for the given input amount"
            })
        );

    } catch (error) {
        return toResult(`Error calculating exchange rate: ${error.message}`, true);
    }
}