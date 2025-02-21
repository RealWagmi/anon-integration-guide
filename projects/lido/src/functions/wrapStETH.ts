import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove
} from "@heyanon/sdk";
import { supportedChains, wstETH_ADDRESS, stETH_ADDRESS } from "../constants";
import wstETHAbi  from "../abis/wstETHAbi"

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Wraps a specified amount of stETH into wstETH.
 * @param props - Wrapping parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function wrapStETH(
  { chainName, account, amount }: Props,
  { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Lido protocol is not supported on ${chainName}`, true);

  // Validate amount
  const amountInWei = parseUnits(amount, 18);
  if (amountInWei === 0n)
    return toResult("Amount must be greater than 0", true);

  await notify("Checking stETH allowance for wrapping...");

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  // Check and prepare approve transaction if needed
  await checkToApprove({
    args: {
      account,
      target: stETH_ADDRESS,
      spender: wstETH_ADDRESS,
      amount: amountInWei,
    },
    provider,
    transactions,
  });

  // Prepare wrap transaction
  const wrapTx: TransactionParams = {
    target: wstETH_ADDRESS,
    data: encodeFunctionData({
      abi: wstETHAbi,
      functionName: "wrap",
      args: [amountInWei],
    }),
  };
  transactions.push(wrapTx);

  await notify("Sending transaction to wrap stETH into wstETH...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const wrapMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? wrapMessage.message
      : `Successfully wrapped ${amount} stETH to wstETH. ${wrapMessage.message}`
  );
}
