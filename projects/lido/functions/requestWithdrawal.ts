import { Address, encodeFunctionData, parseEther } from "viem";
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from "@heyanon/sdk";
import { supportedChains, withdrawalContract_ADDRESS } from "../constants";
import withdrawalAbi from "../abis/withdrawalAbi";

interface RequestWithdrawalProps {
  chainName: string;
  account: Address;
  amount: string;
}

export async function requestWithdrawal(
  { chainName, account, amount }: RequestWithdrawalProps,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult("Wallet not connected", true);

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!amount || parseFloat(amount) <= 0) {
    return toResult("Invalid withdrawal amount", true);
  }

  try {
    const amountInWei = parseEther(amount);

    await notify(`Preparing to request withdrawal of ${amount} stETH...`);

    // Encode the transaction data
    const requestData = encodeFunctionData({
      abi: withdrawalAbi,
      functionName: "requestWithdrawal",
      args: [amountInWei],
    });

    // Prepare the transaction
    const tx = {
      to: withdrawalContract_ADDRESS as `0x${string}`,
      data: requestData,
      chainId,
    };

    // Get Ethereum provider
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      return toResult("No Ethereum provider found. Please install MetaMask or another wallet.", true);
    }

    // Sign the transaction
    await notify(`Signing the transaction for withdrawal request...`);
    const signedTransaction = await ethereum.request({
      method: "eth_signTransaction",
      params: [tx],
    });

    if (!signedTransaction) {
      return toResult("Transaction signing failed.", true);
    }

    await notify(`Transaction signed successfully. Sending to the network...`);

    // Send the signed transaction
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [signedTransaction],
    });

    await notify(`Successfully requested withdrawal of ${amount} stETH.`);

    return toResult(`Successfully requested withdrawal of ${amount} stETH.`);
  } catch (error) {
    return toResult(
      `Failed to request withdrawal: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}
