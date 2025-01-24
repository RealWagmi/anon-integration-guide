import { Address, encodeFunctionData, parseEther } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, wstETH_ADDRESS } from "../constants";
import wstETHAbi from "../abis/wstETHAbi";

interface UnwrapProps {
  chainName: string;
  account: Address;
  amount: string;
}

export async function unwrapWstETH(
  { chainName, account, amount }: UnwrapProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!amount || parseFloat(amount) <= 0) {
    return toResult("Invalid unwrap amount", true);
  }

  try {
    const amountInWei = parseEther(amount);

    await notify(`Preparing to unwrap ${amount} wstETH...`);

    // Encode the unwrap transaction
    const unwrapData = encodeFunctionData({
      abi: wstETHAbi,
      functionName: "unwrap",
      args: [amountInWei],
    });

    // Send the transaction
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [
        {
          target: wstETH_ADDRESS as `0x${string}`,
          data: unwrapData,
        },
      ],
    });

    await notify(`Successfully unwrapped ${amount} wstETH into stETH.`);

    return toResult(`Successfully unwrapped ${amount} wstETH into stETH.`);
  } catch (error) {
    return toResult(
      `Failed to unwrap wstETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
