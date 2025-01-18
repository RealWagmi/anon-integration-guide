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
 * Repay Token using Venus protocol.
 * 
 * @param props - repay parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Repay result containing the transaction hash.
 */
export async function repayToken(
  { chainName, account, amount, tokenAddress}: Props,
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
    await notify("Preparing to repay Token...");

    // Prepare repay borrowed transaction
    const repayTx: TransactionParams = {
      target: tokenAddress,
      data: encodeFunctionData({
        abi: vTokenAbi,
        functionName: "repayBorrow",
        args: [BigInt(Number(amount) * 1e18)], // Convert to Wei
      }),
    };

    // Send transactions (to repay)
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [repayTx],
    });

    // Check if transaction succeeded
    const repayTxHash = result.data[1]?.transactionHash;
    if (!repayTxHash) {
      return toResult("Failed to repay token", true);
    }

    return toResult(
    result.isMultisig
      ? repayTxHash.message
      : `Successfully repayed ${amount} tokens. ${repayTxHash.message}`
    );
  } catch (error) {
    return toResult(
      `Failed to repay token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
