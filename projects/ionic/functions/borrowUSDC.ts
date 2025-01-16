import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove,
} from "@heyanon/sdk";
import { supportedChains, IONUSDC_ADDRESS, USDC_ADDRESS } from "../constants";
import { ctokenAbi } from "../abis";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Borrows a specified amount of USDC from the protocol.
 * @param props - The borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function borrowUSDC(
  { chainName, account, amount }: Props,
  { sendTransactions, notify, getProvider }: FunctionOptions
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

  await notify("Preparing to borrow USDC...");

  const transactions: TransactionParams[] = [];

  // Prepare borrow transaction
  const tx: TransactionParams = {
    target: IONUSDC_ADDRESS,
    data: encodeFunctionData({
      abi: ctokenAbi,
      functionName: "borrow",
      args: [amountInWei],
    }),
  };
  transactions.push(tx);

  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const borrowMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? borrowMessage.message
      : `Successfully borrowed ${amount} USDC. ${borrowMessage.message}`
  );
}
