import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove,
} from "@heyanon/sdk";
import { supportedChains, IONWETH_ADDRESS, WETH_ADDRESS } from "../constants";
import { ctokenAbi } from "../abis";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Supplies a specified amount of WETH into the protocol.
 * @param props - The supply parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function supplyWETH(
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
  const amountInWei = parseUnits(amount, 18);
  if (amountInWei === 0n)
    return toResult("Amount must be greater than 0", true);

  await notify("Preparing to deposit WETH...");

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  // Check and prepare approve transaction if needed
  await checkToApprove({
    args: {
      account,
      target: WETH_ADDRESS,
      spender: IONWETH_ADDRESS,
      amount: amountInWei,
    },
    provider,
    transactions,
  });

  // Prepare deposit transaction
  const tx: TransactionParams = {
    target: IONWETH_ADDRESS,
    data: encodeFunctionData({
      abi: ctokenAbi,
      functionName: "mint",
      args: [amountInWei],
    }),
  };
  transactions.push(tx);

  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const depositMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? depositMessage.message
      : `Successfully deposited ${amount} WETH. ${depositMessage.message}`
  );
}
