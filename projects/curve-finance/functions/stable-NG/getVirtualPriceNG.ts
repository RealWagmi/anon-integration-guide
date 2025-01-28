import { Address, formatUnits } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains } from "../../constants";
import { curveStableSwapNGAbi } from "../../abis/stable-swap-ng";

interface GetVirtualPriceProps {
    chainName: string;
    poolAddress: Address;
}

/**
 * Gets the virtual price of the Curve StableSwapNG pool
 * Virtual price is an increasing value that tracks the underlying value of the pool tokens
 * @param props - Query parameters
 * @param tools - System tools for blockchain interactions
 * @returns The pool's virtual price in USD
 */
export async function getVirtualPrice(
    { chainName, poolAddress }: GetVirtualPriceProps,
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

        // Get virtual price
        const virtualPrice = await provider.readContract({
            ...poolContract,
            functionName: "get_virtual_price"
        }) as bigint;

        // Format virtual price (18 decimals)
        const formattedPrice = formatUnits(virtualPrice, 18);

        return toResult(
            JSON.stringify({
                virtualPrice: formattedPrice,
                description: "Virtual price represents the theoretical value of each LP token in USD"
            })
        );

    } catch (error) {
        return toResult(`Error fetching virtual price: ${error.message}`, true);
    }
}