import { Address, encodeFunctionData } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, withdrawalContract_ADDRESS } from "../constants";
import withdrawalAbi from "../abis/withdrawalAbi";

interface ClaimWithdrawalProps {
  chainName: string;
  account: Address;
  withdrawalId: string; // Unique ID of the withdrawal request
}

export async function claimWithdrawal(
  { chainName, account, withdrawalId }: ClaimWithdrawalProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!withdrawalId) {
    return toResult("Invalid withdrawal ID", true);
  }

  try {
    await notify(`Preparing to claim withdrawal with ID: ${withdrawalId}...`);

    // Encode the claim transaction
    const claimData = encodeFunctionData({
      abi: withdrawalAbi,
      functionName: "claimWithdrawal",
      args: [withdrawalId],
    });

    // Prepare the transaction
    const tx = {
      target: withdrawalContract_ADDRESS as `0x${string}`,
      data: claimData,
    };

    // Send the transaction
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [tx],
    });

    await notify(`Successfully claimed withdrawal with ID: ${withdrawalId}.`);

    return toResult(`Successfully claimed withdrawal with ID: ${withdrawalId}.`);
  } catch (error) {
    return toResult(
      `Failed to claim withdrawal: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
