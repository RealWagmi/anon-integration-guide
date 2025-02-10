import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove
} from "@heyanon/sdk";
import { supportedChains, LIDO_WITHDRAWAL_ADDRESS, stETH_ADDRESS } from "../constants";
import  withdrawalAbi  from "../abis/withdrawalAbi";

interface WithdrawProps {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Requests a withdrawal of stETH from the Lido protocol.
 * @param props - Withdrawal parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function requestWithdrawStETH(
  { chainName, account, amount }: WithdrawProps,
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

  await notify("Checking stETH allowance for withdrawal...");

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  // Check and prepare approve transaction if needed
  await checkToApprove({
    args: {
      account,
      target: stETH_ADDRESS,
      spender: LIDO_WITHDRAWAL_ADDRESS,
      amount: amountInWei,
    },
    provider,
    transactions,
  });

  // Prepare withdrawal transaction
  const withdrawTx: TransactionParams = {
    target: LIDO_WITHDRAWAL_ADDRESS,
    data: encodeFunctionData({
      abi: withdrawalAbi,
      functionName: "requestWithdrawals",
      args: [[amountInWei], account],
    }),
  };
  transactions.push(withdrawTx);

  await notify("Sending transaction to request stETH withdrawal...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const withdrawMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? withdrawMessage.message
      : `Withdrawal request of ${amount} stETH submitted. ${withdrawMessage.message}`
  );
}
