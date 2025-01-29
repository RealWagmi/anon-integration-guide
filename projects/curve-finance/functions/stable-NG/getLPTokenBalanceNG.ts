import { Address, formatUnits } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains } from "../../constants";
import { curveStableSwapNGAbi } from "../../abis/stable-swap-ng";

interface GetLPTokenBalanceProps {
    chainName: string;
    poolAddress: Address;
    userAddress: Address;
}

/**
 * Gets the LP token balance and related pool information for a user
 * @param props - Query parameters
 * @param tools - System tools for blockchain interactions
 * @returns The user's LP token balance and pool details
 */
export async function getLPTokenBalance(
    { chainName, poolAddress, userAddress }: GetLPTokenBalanceProps,
    { getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!userAddress) return toResult("User address is required", true);

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

        // Get LP token balance
        const balance = await provider.readContract({
            ...poolContract,
            functionName: "balanceOf",
            args: [userAddress]
        }) as bigint;

        // Get total supply
        const totalSupply = await provider.readContract({
            ...poolContract,
            functionName: "totalSupply"
        }) as bigint;

        // Get virtual price
        const virtualPrice = await provider.readContract({
            ...poolContract,
            functionName: "get_virtual_price"
        }) as bigint;

        // Format values
        const formattedBalance = formatUnits(balance, 18);
        const formattedTotalSupply = formatUnits(totalSupply, 18);
        const formattedVirtualPrice = formatUnits(virtualPrice, 18);

        // Calculate share percentage
        const sharePercentage = totalSupply > 0n
            ? (Number(balance) * 100 / Number(totalSupply)).toFixed(4)
            : "0";

        // Calculate USD value (approximate)
        const usdValue = (Number(formattedBalance) * Number(formattedVirtualPrice)).toFixed(2);

        return toResult(
            JSON.stringify({
                lpTokenBalance: formattedBalance,
                sharePercentage: sharePercentage,
                usdValue: usdValue,
                virtualPrice: formattedVirtualPrice,
                totalSupply: formattedTotalSupply,
                poolAddress: poolAddress,
                userAddress: userAddress,
                description: "LP token balance and pool share information"
            })
        );

    } catch (error) {
        return toResult(`Error fetching LP token balance: ${error.message}`, true);
    }
}