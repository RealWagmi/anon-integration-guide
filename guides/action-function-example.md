# Action Function Example

```typescript
import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove
} from "@heyanon/sdk";
import { supportedChains, PROTOCOL_ADDRESS, TOKEN_ADDRESS } from "../constants";
import { protocolAbi } from "../abis";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

/**
 * Deposits a specified amount of tokens into the protocol.
 * @param props - The deposit parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function deposit(
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

  await notify("Preparing to deposit tokens...");

  const provider = getProvider(chainId);
  const transactions: TransactionParams[] = [];

  // Check and prepare approve transaction if needed
  await checkToApprove({
      args: {
          account,
          target: TOKEN_ADDRESS,
          spender: PROTOCOL_ADDRESS,
          amount: amountInWei
      },
      provider,
      transactions
    }
  );

  // Prepare deposit transaction
  const tx: TransactionParams = {
    target: PROTOCOL_ADDRESS,
    data: encodeFunctionData({
      abi: protocolAbi,
      functionName: "deposit",
      args: [amountInWei, account],
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
      : `Successfully deposited ${amount} tokens. ${depositMessage.message}`
  );
}
```

**Key Points**:

- Validates input arguments.
- Uses `notify` to inform the user.
- Calls `sendTransactions` only once with the transaction array.
- Returns the result using `toResult`.
- Includes JSDoc comments.
  </code_block_to_apply_changes_from>
