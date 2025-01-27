import { Address, encodeFunctionData, decodeFunctionResult } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, wstETH_ADDRESS } from "../constants";
import  wstEthAbi  from "../abis/wstETHAbi";

interface ConvertProps {
  chainName: string;
  amount: string; // Amount of stETH
}
export async function getStETHForWstETH(
  args: { chainName: string; amount: string; account: `0x${string}` },
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  const { chainName, amount, account } = args;

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  try {
    const amountInWei = BigInt(amount) * 10n ** 18n;

    await notify(`Calculating stETH for ${amount} wstETH...`);

    const data = encodeFunctionData({
      abi: wstEthAbi,
      functionName: "getStETHByWstETH",
      args: [amountInWei],
    });

    const result = await sendTransactions({
      chainId,
      account,
      transactions: [
        {
          target: wstETH_ADDRESS as `0x${string}`,
          data,
        },
      ],
    });

    const rawData = result.data[0] as unknown as `0x${string}`;
    const stETH = decodeFunctionResult({
      abi: wstEthAbi,
      functionName: "getStETHByWstETH",
      data: rawData,
    }) as [bigint];

    return toResult((stETH[0] / 10n ** 18n).toString());
  } catch (error) {
    return toResult(
      `Failed to calculate stETH for wstETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}

  
  
