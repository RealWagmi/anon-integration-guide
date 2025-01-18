import {
  Address,
  encodeFunctionData,
  parseUnits,
} from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
} from "@heyanon/sdk";
import {
  supportedChains,
} from "../constants";
import { vTokenAbi } from "../abis/vTokenAbi";


interface Props {
  chainName: string;
  account: Address;
  tokenAddress: Address
}


/**
 * Retrieves the current borrow rate from the Venus protocol.
 * 
 * @returns {Promise<FunctionReturn>} - The borrow rate for Token.
 */
export async function borrowRateVToken( { chainName, account, tokenAddress }: Props,
  { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Protocol is not supported on ${chainName}`, true);

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  const tx: TransactionParams = {
    target: tokenAddress,
    data: encodeFunctionData({
      abi: vTokenAbi,
      functionName: "borrowRatePerBlock",
      args: [],
    }),
  };
  transactions.push(tx);
  await notify("Waiting for transaction confirmation...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const borrowRatePerBlock = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? borrowRatePerBlock.message
      : `Borrow rate ${depositMessage.message}`
  );
}