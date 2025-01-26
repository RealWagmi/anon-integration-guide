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


import { vComptrollerAbi } from "../abis/vComptrollerAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";

interface Props {
    chainName: string;
    account: Address;
    token: string;
    pool: string;
}

/**
 * Exit market Venus protocol.
 *
 * @param props - Exit market parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns result containing the transaction hash.
 */
export async function exitMarket(
    { chainName, account, token, pool }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    const wallet = validateWallet({ account })
    if (!wallet.success) {return toResult(wallet.errorMessage, true);}
    // Validate chain
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
    if (!tokenDetails.success) {return toResult(tokenDetails.errorMessage, true);}
    try {
        await notify("Preparing to exit Market...");
        // Prepare transaction
        const exitMarketTx: TransactionParams = {
            target: tokenDetails.data.poolAddress,
            data: encodeFunctionData({
                abi: vComptrollerAbi,
                functionName: "exitMarket",
                args: [tokenDetails.data.tokenAddress]
            }),
        };
        // Send transactions
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: [exitMarketTx],
        });
        const depositMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? depositMessage.message : `Successfully exited Market.`);
    } catch (error) {
        return toResult(
            `Failed to exit market: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}
