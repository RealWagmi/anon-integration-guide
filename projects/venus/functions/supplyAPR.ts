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
    token: string;
    pool: string;
}

/**
 * Retrieves the Supply APR from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The Supply APR.
 */
export async function supplyAPR({chainName, token, pool}: Props,
                                {notify, getProvider}: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    if (supportedChains.indexOf(chainId) === -1)
        return toResult(`Protocol is not supported on ${chainName}`, true);
    try {
        const provider = getProvider(chainId);
        await notify('Getting Current Supply APR...');
        const supplyRatePerBlock = await provider.readContract({
            abi: vBNBAbi,
            address: tokenDetails.data.tokenAddress,
            functionName: 'supplyRatePerBlock',
            args: [],
        });

        const blocksPerYear = tokenDetails.data.blocksPerYear;
        const supplyAPR = (supplyRatePerBlock * blocksPerYear);
        //16 to get the percent as decimals is always 18 here.
        return toResult(`Supply APR for ${token}: ${parseFloat(formatUnits(supplyAPR, 16)).toFixed(2)}%`);
    } catch (error) {
        return toResult(
            `Failed to get Supply APR: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}