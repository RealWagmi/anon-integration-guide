import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
} from "@heyanon/sdk";
import { supportedChains, IONUSDC_ADDRESS } from "../constants";
import { ctokenAbi } from "../abis";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Withdraws a specified amount of USDC from the protocol.
 * @param props - The withdraw parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function withdrawUSDC(
  { chainName, account, amount }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Protocol is not supported on ${chainName}`, true);

  // Validate amount
  const amountInWei = parseUnits(amount, 6);
  if (amountInWei === 0n)
    return toResult("Amount must be greater than 0", true);

  await notify("Preparing to withdraw USDC...");

  const transactions: TransactionParams[] = [];

  // Prepare withdraw transaction
  const tx: TransactionParams = {
    target: IONUSDC_ADDRESS,
    data: encodeFunctionData({
      abi: ctokenAbi,
      functionName: "redeemUnderlying",
      args: [amountInWei],
    }),
  };
  transactions.push(tx);

  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const withdrawMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? withdrawMessage.message
      : `Successfully withdrew ${amount} USDC. ${withdrawMessage.message}`
  );
}
