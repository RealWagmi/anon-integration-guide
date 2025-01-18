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
 * Redeem Token using Venus protocol.
 * 
 * @param props - redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Redeem result containing the transaction hash.
 */
export async function redeemToken(
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
    await notify("Preparing to redeem Token...");

    // Prepare redeem deposited transaction
    const redeemTx: TransactionParams = {
      target: tokenAddress,
      data: encodeFunctionData({
        abi: vTokenAbi,
        functionName: "redeem",
        args: [BigInt(Number(amount) * 1e18)], // Convert to Wei
      }),
    };

    // Send transactions (to redeem)
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [redeemTx],
    });

    // Check if transaction succeeded
    const redeemTxHash = result.data[1]?.transactionHash;
    if (!redeemTxHash) {
      return toResult("Failed to redeem token", true);
    }

    return toResult(
    result.isMultisig
      ? redeemTxHash.message
      : `Successfully redeemed ${amount} tokens. ${redeemTxHash.message}`
    );
  } catch (error) {
    return toResult(
      `Failed to redeem token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
