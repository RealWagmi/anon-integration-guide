# Action Functions Implementation Guide

Action functions perform transactions and interact with the blockchain. They use the `sendTransactions` function from `FunctionOptions` to execute transactions.

## Guidelines

1. **Function and File Naming**

   - The function name must match the file name.
   - One function per file in the `functions/` directory.

2. **Input Validation**

   - Validate all input arguments at the beginning of the function.
   - Return informative error messages using `toResult`.

3. **Using `notify`**

   - Use the `notify` function from `FunctionOptions` to inform users about the operations being performed.
   - Example:

     ```typescript
     await notify("Preparing to deposit tokens...");
     ```

4. **Transaction Signing**

   - Use the `sendTransactions` function from `FunctionOptions` **once** in the function.
   - Pass an array of transactions that need to be signed.
   - Example:

     ```typescript
      const transactions: EVM.types.TransactionParams[] = [];

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
      const tx: EVM.types.TransactionParams = {
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
      const depositData = result.data[result.data.length - 1];

      return toResult(
        result.isMultisig
          ? depositMessage.message
          : `Successfully deposited ${amount} tokens. ${JSON.stringify(depositData)}`
      );
     ```

5. **Returning Results**

   - Always return results using the `toResult` transformer.
   - Provide a success message or return an error if necessary.
   - Handle multisig cases appropriately.
   - Example:

     ```typescript
      return toResult(
        result.isMultisig
          ? depositMessage.message
          : `Successfully deposited ${amount} tokens. ${JSON.stringify(depositData)}`
      );
     ```

6. **Comments and Documentation**

   - Include JSDoc comments for the function.
   - Use comments to explain complex logic or skipped code sections.
   - Do not leave blank lines within functions.

## Example: `mintToken`

See the code in the [Action Function Example](action-function-example.md).
