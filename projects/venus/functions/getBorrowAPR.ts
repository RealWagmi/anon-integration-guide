import {
    formatUnits,
} from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    toResult,
    getChainFromName,
} from "@heyanon/sdk";
import {
    supportedChains,
} from "../constants";
import {vBNBAbi} from "../abis/vBNBAbi";
import {validateAndGetTokenDetails} from "../utils";

interface Props {
    chainName: string;
    tokenSymbol: string;
    pool: string;
}

/**
 * Retrieves the Borrow APR of token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The borrow APR.
 */
export async function getBorrowAPR({chainName, tokenSymbol, pool}: Props,
                                   {notify, getProvider}: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, tokenSymbol: tokenSymbol})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    if (supportedChains.indexOf(chainId) === -1)
        return toResult(`Protocol is not supported on ${chainName}`, true);
    try {
        const provider = getProvider(chainId);
        await notify('Getting current Borrow APY');
        const borrowRatePerBlock = await provider.readContract({
            abi: vBNBAbi,
            address: tokenDetails.data.vTokenAddress,
            functionName: 'borrowRatePerBlock',
            args: [],
        });

        const blocksPerYear = tokenDetails.data.blocksPerYear;
        const borrowAPR = (borrowRatePerBlock * blocksPerYear);
        return toResult(`Borrow APR for ${tokenSymbol}: ${parseFloat(formatUnits(borrowAPR, 16)).toFixed(2)}%`);
    } catch (error) {
        return toResult(
            `Failed to Fetch current APY: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}