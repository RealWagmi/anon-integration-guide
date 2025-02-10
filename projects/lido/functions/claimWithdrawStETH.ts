import { Address, encodeFunctionData, parseEther } from 'viem';
import {
  FunctionReturn,
  FunctionOptions,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, LIDO_WITHDRAWAL_ADDRESS } from '../constants';
import withdrawalAbi from '../abis/withdrawalAbi';

interface ClaimWithdrawalProps {
  chainName: string; // Name of the blockchain network (e.g., "Ethereum")
  account: Address; // User's wallet address
  requestIds: number[]; // Unique IDs of the withdrawal requests to claim
}

/**
 * Claims ETH from completed withdrawal requests in the Lido protocol.
 * @param {ClaimWithdrawalProps} params - Contains the chain name, account address, and withdrawal request IDs.
 * @param {FunctionOptions} options - Provides the `sendTransactions` and `notify` utilities.
 * @returns {Promise<FunctionReturn>} - A promise resolving to a success message or an error message.
 */
export async function claimWithdrawStETH(
  { chainName, account, requestIds }: ClaimWithdrawalProps,
  { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) return toResult('Wallet not connected', true);

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return toResult('Invalid request: No valid withdrawal request IDs provided.', true);
  }

  // Get the chain ID from the chain name
  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    const publicClient = getProvider(chainId);
    const hints = new Array(requestIds.length).fill(0); // Assuming hints array can be filled with 0s

    // Get claimable ETH amount
    const claimableEthValues = await publicClient.readContract({
      address: LIDO_WITHDRAWAL_ADDRESS,
      abi: withdrawalAbi,
      functionName: 'getClaimableEther',
      args: [requestIds, hints],
    });

    if (!Array.isArray(claimableEthValues)) {
      return toResult(
        'Invalid response from contract: expected array of claimable ETH values.',
        true
      );
    }

    // Sum all claimable ETH
    const totalClaimable = claimableEthValues.reduce(
      (sum, value) => sum + BigInt(value),
      0n
    );

    if (totalClaimable === 0n) {
      return toResult('No claimable ETH available.', true);
    }

    // Notify the user about the claim process
    await notify(
      `Claiming ETH for withdrawal request IDs: ${requestIds.join(', ')}...`
    );

    // Prepare the claim transaction
    const tx = {
      target: LIDO_WITHDRAWAL_ADDRESS as `0x${string}`, // Lido withdrawal contract address
      data: encodeFunctionData({
        abi: withdrawalAbi, // ABI of the Lido withdrawal contract
        functionName: 'claimWithdrawals', // Function to call
        args: [requestIds, account], // Withdrawal request IDs and recipient address
      }),
    };

    // Send the transaction to claim the ETH
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [tx],
    });

    // Return success message
    return toResult(`Withdrawal claimed. Transaction: ${result.data}`);
  } catch (error) {
    // Handle errors during the claim process
    return toResult(
      `Failed to claim withdrawal: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
