import {
    Address,
    encodeFunctionData, parseUnits,
} from "viem";

import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
} from "@heyanon/sdk";


import {vBNBAbi} from "../abis/vBNBAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    token: string;
    pool: string;
}

/**
 * Redeem Token using Venus protocol.
 *
 * @param props - redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Redeem result containing the transaction hash.
 */
export async function redeemUnderlying(
    {chainName, account, amount, token, pool}: Props,
    {sendTransactions, notify}: FunctionOptions
): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    if (!amount || typeof amount !== 'string') {
        return toResult('Invalid amount', true);
    }
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    try {
        await notify("Preparing to redeem Token...");
        // Prepare redeem deposited transaction
        const redeemTx: TransactionParams = {
            target: tokenDetails.data.tokenAddress,
            data: encodeFunctionData({
                abi: vBNBAbi,
                functionName: "redeemUnderlying",
                args: [parseUnits(amount, tokenDetails.data.tokenDecimals)], // Convert to Wei
            }),
        };
        // Send transactions (to redeem)
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: [redeemTx],
        });
        const redeemMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? redeemMessage.message : `Successfully redeemed ${amount} BNB.`);
    } catch (error) {
        return toResult(
            `Failed to redeem token: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}
