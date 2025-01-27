import { encodeFunctionData, decodeFunctionResult } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, wstETH_ADDRESS } from "../constants";
import  wstEthAbi  from "../abis/wstETHAbi";


export async function getWstETHForStETH(
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

    await notify(`Calculating wstETH for ${amount} stETH...`);

    const data = encodeFunctionData({
      abi: wstEthAbi,
      functionName: "getWstETHByStETH",
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
    const wstETH = decodeFunctionResult({
      abi: wstEthAbi,
      functionName: "getWstETHByStETH",
      data: rawData,
    }) as [bigint];

    return toResult((wstETH[0] / 10n ** 18n).toString());
  } catch (error) {
    return toResult(
      `Failed to calculate wstETH for stETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}


  
  
