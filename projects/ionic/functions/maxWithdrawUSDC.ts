import { Address, encodeFunctionData, maxUint256 } from "viem";
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
}

/**
 * Withdraws maximum available USDC from the protocol.
 * @param props - The withdraw parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function maxWithdrawUSDC(
  { chainName, account }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Protocol is not supported on ${chainName}`, true);

  await notify("Preparing to withdraw all USDC...");

  // Prepare withdraw transaction
  const tx: TransactionParams = {
    target: IONUSDC_ADDRESS,
    data: encodeFunctionData({
      abi: ctokenAbi,
      functionName: "redeem",
      args: [maxUint256],
    }),
  };

  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({
    chainId,
    account,
    transactions: [tx],
  });
  const withdrawMessage = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? withdrawMessage.message
      : `Successfully withdrew maximum USDC. ${withdrawMessage.message}`
  );
}
