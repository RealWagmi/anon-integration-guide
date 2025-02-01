import {
    Address,
    encodeFunctionData,
} from "viem";

import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
} from "@heyanon/sdk";

import {vComptrollerAbi} from "../abis/vComptrollerAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";

interface Props {
    chainName: string;
    account: Address;
    token: string;
    pool: string;
}

/**
 * Declare assets as collateral in Venus protocol.
 *
 * @param props - Enter market parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns result containing the transaction hash.
 */
export async function enterMarkets(
    {chainName, account, token, pool}: Props,
    {sendTransactions, notify}: FunctionOptions
): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    // Validate chain
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    try {
        await notify("Preparing to enter Market...");
        // Prepare to enter markets
        const enterMarketsTx: TransactionParams = {
            target: tokenDetails.data.poolAddress,
            data: encodeFunctionData({
                abi: vComptrollerAbi,
                functionName: "enterMarkets",
                args: [[tokenDetails.data.tokenAddress]]
            }),
        };
        // Send transactions
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: [enterMarketsTx],
        });
        const message = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? message.message : `Successfully entered Market.`);
    } catch (error) {
        return toResult(
            `Failed to enter market: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}
