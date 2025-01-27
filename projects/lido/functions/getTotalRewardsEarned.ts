import { Address, decodeFunctionResult, encodeFunctionData } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, stETH_ADDRESS } from "../constants";
import  lidoAbi  from "../abis/lidoAbi";

interface TotalRewardsProps {
  chainName: string;
  account: Address;
  initialStakedAmount: string; // Amount of ETH initially staked
}

export async function getTotalRewardsEarned(
  { chainName, account, initialStakedAmount }: TotalRewardsProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  try {
    await notify("Fetching your stETH balance...");

    // Encode the balanceOf call
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

    // Safely cast to the appropriate type
    const rawBalanceData = result.data[0] as unknown as `0x${string}`;
    const balance = decodeFunctionResult({
      abi: lidoAbi,
      functionName: "balanceOf",
      data: rawBalanceData,
    }) as [bigint];

    // Convert balance from WEI to ETH
    const currentBalance = Number(balance[0]) / 10 ** 18; // Convert bigint to number for calculations
    const initialStaked = parseFloat(initialStakedAmount);

    const totalRewards = currentBalance - initialStaked;

    return toResult(`Total Rewards Earned: ${totalRewards.toFixed(4)} ETH`);
  } catch (error) {
    return toResult(
      `Failed to fetch total rewards: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
