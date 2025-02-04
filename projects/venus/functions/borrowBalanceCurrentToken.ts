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


import {vBNBAbi} from "../abis/vBNBAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";


interface Props {
    chainName: string;
    account: Address;
    tokenSymbol: string;
    pool: string;
}


/**
 * Retrieves the borrow balance of token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The borrow balance of Token.
 */
export async function borrowBalanceCurrentToken({chainName, account, tokenSymbol, pool}: Props,
                                                {sendTransactions, notify,}: FunctionOptions): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, tokenSymbol: tokenSymbol})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    try {
        await notify("Preparing transaction...");
        const borrowBalanceCurrent: TransactionParams = {
            target: tokenDetails.data.tokenAddress,
            data: encodeFunctionData({
                abi: vBNBAbi,
                functionName: "borrowBalanceCurrent",
                args: [wallet.data.account],
            }),
        };
        // Send transactions (to redeem)
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: [borrowBalanceCurrent],
        });
        const borrowMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? borrowMessage.message : `Successfully fetched borrow balance of ${tokenSymbol}.`);
    } catch (error) {
        return toResult(
            `Failed to redeem token: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}