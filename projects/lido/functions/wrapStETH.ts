import { Address, encodeFunctionData, decodeFunctionResult, parseEther } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, stETH_ADDRESS, wstETH_ADDRESS } from "../constants";
import lidoAbi from "../abis/lidoAbi";
import wstETHAbi from "../abis/wstETHAbi";

interface WrapStETHProps {
  chainName: string;
  account: Address;
  amount: string;
}

export async function wrapStETH(
  { chainName, account, amount }: WrapStETHProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!amount || parseFloat(amount) <= 0) {
    return toResult("Invalid wrap amount", true);
  }

  try {
    const amountInWei = parseEther(amount);

    // Step 1: Check Allowance
    await notify(`Checking stETH allowance for wstETH contract...`);
    const allowanceData = encodeFunctionData({
      abi: lidoAbi,
      functionName: "allowance",
      args: [account, wstETH_ADDRESS],
    });

    const allowanceResult = await sendTransactions({
      chainId,
      account,
      transactions: [
        {
          target: stETH_ADDRESS as `0x${string}`,
          data: allowanceData,
        },
      ],
    });

    const rawAllowanceData = allowanceResult.data[0] as unknown as `0x${string}`;
    const allowance = decodeFunctionResult({
      abi: lidoAbi,
      functionName: "allowance",
      data: rawAllowanceData,
    }) as [bigint];

    // Step 2: Unlock if Allowance is Insufficient
    if (allowance[0] < amountInWei) {
      await notify(`Insufficient allowance. Unlocking ${amount} stETH...`);
      const approveData = encodeFunctionData({
        abi: lidoAbi,
        functionName: "approve",
        args: [wstETH_ADDRESS, amountInWei],
      });

      await sendTransactions({
        chainId,
        account,
        transactions: [
          {
            target: stETH_ADDRESS as `0x${string}`,
            data: approveData,
          },
        ],
      });

      await notify(`Successfully unlocked ${amount} stETH.`);
    }

    // Step 3: Wrap stETH
    await notify(`Preparing to wrap ${amount} stETH...`);
    const wrapData = encodeFunctionData({
      abi: wstETHAbi,
      functionName: "wrap",
      args: [amountInWei],
    });

    const result = await sendTransactions({
      chainId,
      account,
      transactions: [
        {
          target: wstETH_ADDRESS as `0x${string}`,
          data: wrapData,
        },
      ],
    });

    await notify(`Successfully wrapped ${amount} stETH.`);
    return toResult(`Successfully wrapped ${amount} stETH.`);
  } catch (error) {
    return toResult(
      `Failed to wrap stETH: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
