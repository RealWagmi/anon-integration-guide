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
 * Repays a specified amount of USDC to the protocol.
 * @param props - The repay parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function repayUSDC(
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

  await notify("Preparing to repay USDC...");

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  // Check and prepare approve transaction if needed
  await checkToApprove({
    args: {
      account,
      target: USDC_ADDRESS,
      spender: IONUSDC_ADDRESS,
      amount: amountInWei,
    },
    provider,
    transactions,
  });

  // Prepare repay transaction
  const tx: TransactionParams = {
    target: IONUSDC_ADDRESS,
    data: encodeFunctionData({
      abi: ctokenAbi,
      functionName: "repayBorrow",
      args: [amountInWei],
    }),
  };
  transactions.push(tx);

  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const repayMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? repayMessage.message
      : `Successfully repaid ${amount} USDC. ${repayMessage.message}`
  );
}
