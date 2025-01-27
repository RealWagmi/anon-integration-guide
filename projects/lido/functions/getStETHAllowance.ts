import { Address, encodeFunctionData, decodeFunctionResult } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { stETH_ADDRESS, wstETH_ADDRESS, supportedChains } from "../constants";
import lidoAbi from "../abis/lidoAbi";

interface AllowanceProps {
  chainName: string;
  account: Address;
}

// Function to get stETH allowance for the wstETH contract
export async function getStETHAllowance(
    { chainName, account }: AllowanceProps,
    { sendTransactions }: FunctionOptions
  ): Promise<FunctionReturn> {
    if (!account) return toResult("Wallet not connected", true);
  
    const chainId = getChainFromName(chainName);
    if (!chainId || !supportedChains.includes(chainId)) {
      return toResult(`Unsupported chain: ${chainName}`, true);
    }
  
    try {
      const allowanceData = encodeFunctionData({
        abi: lidoAbi,
        functionName: "allowance",
        args: [account, wstETH_ADDRESS],
      });
  
      const result = await sendTransactions({
        chainId,
        account,
        transactions: [
          {
            target: stETH_ADDRESS,
            data: allowanceData,
          },
        ],
      });
  
      // Ensure the result contains data
      if (result.data && result.data.length > 0) {
        // Explicitly cast `result.data[0]` to the stricter type
        const rawData = result.data[0] as unknown as `0x${string}`;
  
        // Decode the raw data
        const allowance = decodeFunctionResult({
          abi: lidoAbi,
          functionName: "allowance",
          data: rawData,
        }) as [bigint]; // Allowance output is typically a single BigInt value
  
        return toResult(allowance[0].toString());
      }
  
      return toResult("Failed to get stETH allowance: No data returned", true);
    } catch (error) {
      return toResult(
        `Failed to get stETH allowance: ${error instanceof Error ? error.message : "Unknown error"}`,
        true
      );
    }
}