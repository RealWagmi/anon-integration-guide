import { Address, encodeFunctionData } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, LIDO_WITHDRAWAL_ADDRESS } from '../constants';
import withdrawalAbi from '../abis/withdrawalAbi';
const { getChainFromName } = EVM.utils;

interface ClaimWithdrawalProps {
  chainName: string; // Name of the blockchain network (e.g., "Ethereum")
  account: Address; // User's wallet address
  requestIds: number[]; // Unique IDs of the withdrawal requests to claim
}

/**
 * Claims a batch of withdrawal requests if they are finalized, sending locked ether to the owner
 * @param {ClaimWithdrawalProps} params - Contains the chain name, account address, withdrawal request IDs, and hints
 * @param {FunctionOptions} options - Provides the `sendTransactions` and `notify` utilities
 * @returns {Promise<FunctionReturn>} - A promise resolving to a success message or an error message
 */
export async function claimWithdrawStETH({ chainName, account, requestIds }: ClaimWithdrawalProps, options: FunctionOptions): Promise<FunctionReturn> {
  const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;
  
  // Input validation
  if (!account) return toResult('Wallet not connected', true);

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return toResult('Invalid request: No valid withdrawal request IDs provided.', true);
  }


  const hints = requestIds.map(()=>BigInt(0))
  const requestIdsBigInt = requestIds.map(id => BigInt(id));

  // Get the chain ID from the chain name
  const chainId = getChainFromName(chainName as EvmChain);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    const publicClient = getProvider(chainId);

    // Check withdrawal status for all requests
    const withdrawalStatus = await publicClient.readContract({
      address: LIDO_WITHDRAWAL_ADDRESS,
      abi: withdrawalAbi,
      functionName: 'getWithdrawalStatus',
      args: [requestIdsBigInt],
    });

    if (!Array.isArray(withdrawalStatus)) {
      return toResult(
        'Invalid response from contract: expected array of withdrawal statuses.',
        true
      );
    }

    // Check if any requests are not finalized
    if (!withdrawalStatus.every(status => status)) {
      return toResult('Some withdrawal requests are not finalized yet.', true);
    }

    // Get claimable ETH amount
    const claimableEthValues = await publicClient.readContract({
      address: LIDO_WITHDRAWAL_ADDRESS,
      abi: withdrawalAbi,
      functionName: 'getClaimableEther',
      args: [requestIdsBigInt, hints],
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
      BigInt(0)
    );

    // Notify the user about the claim process
    await notify(
      `Claiming ${totalClaimable.toString()} ETH for ${requestIds.length} withdrawal requests...`
    );

    // Prepare the claim transaction
    const tx = {
      target: LIDO_WITHDRAWAL_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: withdrawalAbi,
        functionName: 'claimWithdrawals',
        args: [requestIdsBigInt, hints],
      }),
    };

    // Send the transaction to claim the ETH
    const result = await sendTransactions({
      chainId,
      account,
      transactions: [tx],
    });

    // Return success message with claimed amount
    return toResult(
      `Successfully claimed ${totalClaimable.toString()} ETH. Transaction: ${result.data}`
    );
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