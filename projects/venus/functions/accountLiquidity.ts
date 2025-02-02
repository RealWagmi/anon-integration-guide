import {
    formatUnits, Address
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
import {vComptrollerAbi} from "../abis/vComptrollerAbi";

interface Props {
    chainName: string;
    account: Address;
    token: string;
    pool: string;
}

/**
 * Retrieves the Liquidity of token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>}.
 */
export async function accountLiquidity({chainName, account, token, pool}: Props,
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
        await notify('Getting Account Liquidity...');
        const [shortfall, liquidity] = await provider.readContract({
            abi: vComptrollerAbi,
            address: tokenDetails.data.poolAddress,
            functionName: 'getAccountLiquidity',
            args: [account],
        });
        //Always 18
        const borrowLimit = parseFloat(formatUnits(liquidity, 18)).toFixed(2);
        const shortFall = parseFloat(formatUnits(shortfall, 18)).toFixed(2);
        return toResult(`Borrow Limit: $${borrowLimit}, Shortfall: $${shortFall}`);

    } catch (error) {
        return toResult(
            `Failed to get account liquidity: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}