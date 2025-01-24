import { Address, encodeFunctionData, decodeFunctionResult } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, stETH_ADDRESS } from "../constants";
import lidoAbi from "../abis/lidoAbi";

export async function getTotalStaked(
  args: { chainName: string; account: Address }, // Include account in args
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  const { chainName, account } = args;

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  try {
    await notify(`Fetching total staked ETH in Lido...`);

    const data = encodeFunctionData({
      abi: lidoAbi,
      functionName: "getTotalPooledEther",
      args: [],
    });

    const result = await sendTransactions({
      chainId,
      account, // Use account from args
      transactions: [
        {
          target: stETH_ADDRESS as `0x${string}`,
          data,
        },
      ],
    });

    const rawData = result.data[0] as unknown as `0x${string}`;
    const totalStaked = decodeFunctionResult({
      abi: lidoAbi,
      functionName: "getTotalPooledEther",
      data: rawData,
    }) as [bigint];

    // Convert from WEI to ETH and return as string
    return toResult((totalStaked[0] / 10n ** 18n).toString());
  } catch (error) {
    return toResult(
      `Failed to fetch total staked ETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
