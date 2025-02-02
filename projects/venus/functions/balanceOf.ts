import {
    Address,
    formatUnits
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
import {validateAndGetTokenDetails, validateWallet} from "../utils";

interface Props {
    chainName: string;
    account: Address;
    token: string;
    pool: string;
}

/**
 * Retrieves the balance of token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The balance of Token.
 */
export async function balanceOf({chainName, account, token, pool}: Props,
                                {notify, getProvider}: FunctionOptions): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
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
        await notify('Checking Balance of token...');
        const balanceOf = await provider.readContract({
            abi: vBNBAbi,
            address: tokenDetails.data.tokenAddress,
            functionName: 'balanceOf',
            args: [account],
        }) as bigint;
        //All vTokens are 8 decimals
        return toResult(`Balance of ${token}: ${formatUnits(balanceOf, 8)}`);
    } catch (error) {
        return toResult(
            `Failed to Get Balance: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}