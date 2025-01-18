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
 * Retrieves the borrow balance of token from the Venus protocol.
 * 
 * @returns {Promise<FunctionReturn>} - The borrow balance of Token.
 */
export async function borrowBalanceCurrentToken( { chainName, account, tokenAddress }: Props,
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
      functionName: "borrowBalanceCurrent",
      args: [account],
    }),
  };
  transactions.push(tx);
  await notify("Waiting for transaction response...");

  // Sign and send transaction
  const result = await sendTransactions({ chainId, account, transactions });
  const borrowBalanceCurrentToken = result.data[result.data.length - 1];

  return toResult(
    result.isMultisig
      ? borrowBalanceCurrentToken.message
      : `Borrow Balance: ${borrowBalanceCurrentToken.message}`
  );
}