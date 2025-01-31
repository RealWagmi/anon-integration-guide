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

import { vBNBAbi } from "../abis/vBNBAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
  token: string;
  pool: string;
}


/**
 * Borrows Token using Venus protocol.
 * 
 * @param props - Borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function borrowToken(
  { chainName, account, amount, token, pool }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  const wallet = validateWallet({ account })
  if (!wallet.success) {return toResult(wallet.errorMessage, true);}
  if (!amount || typeof amount !== 'string') {return toResult('Invalid amount', true);}
  // Validate chain
  const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
  if (!tokenDetails.success) {return toResult(tokenDetails.errorMessage, true);}
  try {
    await notify("Preparing to borrow Token...");
    // Prepare borrow transaction
    const borrowTx: TransactionParams = {
      target: tokenDetails.data.tokenAddress,
      data: encodeFunctionData({
        abi: vBNBAbi,
        functionName: "borrow",
        args: [parseUnits(amount, 18)],
      }),
    };
    // Send transactions (enter borrow)
    const result = await sendTransactions({
      chainId: tokenDetails.data.chainId,
      account,
      transactions: [borrowTx],
    });
    const borrowMessage = result.data[result.data.length - 1];
    return toResult(result.isMultisig ? borrowMessage.message : `Successfully borrowed ${amount} ${token}.`);
  } catch (error) {
    return toResult(
      `Failed to borrow token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
