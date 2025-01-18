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
 * Mint Token using Venus protocol.
 * 
 * @param props - mint parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function mintToken(
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
    await notify("Preparing to mint Token...");

    // Prepare mint transaction
    const mintTx: TransactionParams = {
      target: tokenAddress,
      data: encodeFunctionData({
        abi: vTokenAbi,
        functionName: "mint",
        args: [BigInt(Number(amount) * 1e18)], // Convert to Wei
      }),
    };

    // Send transactions (to mint)
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [mintTx],
    });

    // Check if transaction succeeded
    const mintTxHash = result.data[1]?.transactionHash;
    if (!mintTxHash) {
      return toResult("Failed to mint token", true);
    }

    return toResult(
    result.isMultisig
      ? mintTxHash.message
      : `Successfully minted ${amount} tokens. ${mintTxHash.message}`
    );
  } catch (error) {
    return toResult(
      `Failed to mint token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
