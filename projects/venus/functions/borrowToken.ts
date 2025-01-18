import {
  Address,
  encodeFunctionData,
  parseUnits,
} from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
} from "@heyanon/sdk";
import {
  supportedChains,
} from "../constants";
import { vTokenAbi } from "../abis/vTokenAbi";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
  tokenAddress: string;
}


/**
 * Borrows Token using Venus protocol.
 * 
 * @param props - Borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function borrowToken(
  { chainName, account, amount, tokenAddress }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) {
    return toResult("Wallet not connected", true);
  }

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) {
    return toResult(`Unsupported chain name: ${chainName}`, true);
  }
  if (!supportedChains.includes(chainId)) {
    return toResult(`Protocol is not supported on ${chainName}`, true);
  }

  try {
    await notify("Preparing to borrow Token...");

    // Prepare borrow transaction
    const borrowTx: TransactionParams = {
      target: tokenAddress,
      data: encodeFunctionData({
        abi: vTokenAbi,
        functionName: "borrow",
        args: [BigInt(Number(amount) * 1e18)], // Convert to Wei
      }),
    };

    // Send transactions (enter borrow)
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [borrowTx],
    });

    // Check if transaction succeeded
    const borrowTxHash = result.data[1]?.transactionHash;
    if (!borrowTxHash) {
      return toResult("Failed to borrow tokens", true);
    }

    return toResult(
    result.isMultisig
      ? borrowTxHash.message
      : `Successfully borrowed ${amount} tokens. ${borrowTxHash.message}`
    );
  } catch (error) {
    return toResult(
      `Failed to borrow token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
