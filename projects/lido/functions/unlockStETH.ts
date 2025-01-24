import { Address, encodeFunctionData } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { wstETH_ADDRESS, supportedChains, stETH_ADDRESS } from "../constants";
import lidoAbi from "../abis/lidoAbi"

interface AllowanceProps {
  chainName: string;
  account: Address;
}

interface UnlockTokenProps extends AllowanceProps {
  amount: string;
}

// Function to unlock stETH for the wstETH contract
export async function unlockStETH(
  { chainName, account, amount }: UnlockTokenProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!amount || parseFloat(amount) <= 0) {
    return toResult("Invalid unlock amount", true);
  }

  try {
    const amountInWei = BigInt(amount);

    await notify(`Unlocking ${amount} stETH for wstETH contract...`);

    // Encode the approve transaction
    const approveData = encodeFunctionData({
      abi: lidoAbi,
      functionName: "approve",
      args: [wstETH_ADDRESS, amountInWei],
    });

    // Cast stETH_ADDRESS to `0x${string}` to satisfy the type
    const tx = {
      target: stETH_ADDRESS as `0x${string}`,
      data: approveData,
    };

    // Send the transaction
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [tx],
    });

    // Notify the user of success
    await notify(`Successfully unlocked ${amount} stETH.`);

    return toResult(`Successfully unlocked ${amount} stETH.`);
  } catch (error) {
    return toResult(
      `Failed to unlock stETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
