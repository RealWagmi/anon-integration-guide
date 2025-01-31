import {
  Address,
  encodeFunctionData, parseUnits,createPublicClient, http
} from "viem";
import { bsc } from "viem/chains"

import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult, checkToApprove,
} from "@heyanon/sdk";


import { vBNBAbi } from "../abis/vBNBAbi";
import {validateAndGetTokenDetails, validateWallet} from "../utils";
import {vTokenAbi} from "../abis/vTokenAbi";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
  token: string;
  pool: string;
}

/**
 * Repay Token using Venus protocol.
 * 
 * @param props - repay parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Repay result containing the transaction hash.
 */
export async function repayToken(
  { chainName, account, amount, token, pool}: Props,
  { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  const wallet = validateWallet({ account })
  if (!wallet.success) {return toResult(wallet.errorMessage, true);}
  if (!amount || typeof amount !== 'string') {return toResult('Invalid amount', true);}
  // Validate chain
  const tokenDetails = validateAndGetTokenDetails({chainName, pool, token})
  if (!tokenDetails.success) {return toResult(tokenDetails.errorMessage, true);}
  const provider = createPublicClient({
    chain: bsc,
    transport: http(),
  });
  try {
    const underlyingAssetAddress = await provider.readContract({
      abi: vTokenAbi,
      address: tokenDetails.data.tokenAddress,
      functionName: 'underlying',
      args: [],
    });
    console.log(underlyingAssetAddress)
    const transactions: TransactionParams[] = [];
    await checkToApprove({
      args: {
        account,
        target: underlyingAssetAddress,
        spender: tokenDetails.data.tokenAddress,
        amount: parseUnits(amount, tokenDetails.data.tokenDecimals),
      },
      provider,
      transactions
    });

    await notify("Preparing to repay Token...");
    // Prepare repay borrowed transaction
    if (tokenDetails.data.isChainBased) {
      const repayTx: TransactionParams = {
        target: tokenDetails.data.tokenAddress,
        data: encodeFunctionData({
          abi: vBNBAbi,
          functionName: "repayBorrow",
          args: [],
        }),
        value: parseUnits(amount, tokenDetails.data.tokenDecimals),
      };
      transactions.push(repayTx);
    } else {
      const repayTx: TransactionParams = {
        target: tokenDetails.data.tokenAddress,
        data: encodeFunctionData({
          abi: vTokenAbi,
          functionName: "repayBorrow",
          args: [parseUnits(amount, tokenDetails.data.tokenDecimals)],
        }),
      };
      transactions.push(repayTx);
    }
    // Send transactions (to repay)
    const result = await sendTransactions({
      chainId: tokenDetails.data.chainId,
      account,
      transactions: transactions,
    });
    const message = result.data[result.data.length - 1];
    // return toResult("Repaying Token...");
    return toResult(result.isMultisig ? message.message : `Successfully repayed ${amount} ${token}.`);
  } catch (error) {
    return toResult(
      `Failed to repay token: ${error instanceof Error ? error.message : "Unknown error"}`,
      true
    );
  }
}

