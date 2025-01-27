import { Address, encodeFunctionData, decodeFunctionResult } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, stETH_ADDRESS } from "../constants";
import  lidoAbi  from "../abis/lidoAbi";

interface GetBalanceProps {
  chainName: string;
  account: Address;
}

export async function getStETHBalance(
  { chainName, account }: GetBalanceProps,
  { sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  try {
    const balanceData = encodeFunctionData({
      abi: lidoAbi,
      functionName: "balanceOf",
      args: [account],
    });

    const result = await sendTransactions({
      chainId,
      account,
      transactions: [
        {
          target: stETH_ADDRESS as `0x${string}`,
          data: balanceData,
        },
      ],
    });

    const rawBalanceData = result.data[0] as unknown as `0x${string}`;
    const balance = decodeFunctionResult({
      abi: lidoAbi,
      functionName: "balanceOf",
      data: rawBalanceData,
    }) as [bigint];

    return toResult(balance[0].toString());
  } catch (error) {
    return toResult(
      `Failed to get stETH balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
