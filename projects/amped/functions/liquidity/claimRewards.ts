import { Address, getContract, encodeFunctionData, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';

interface Props {
  chainName: string;
  account: Address;
}

/**
 * Claims available rewards from the reward tracker
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to claim rewards for
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with claim details
 */
export async function claimRewards(
  { chainName, account }: Props,
  { getProvider, notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (chainName !== NETWORKS.SONIC) {
    return toResult(`Protocol is only supported on Sonic chain`, true);
  }

  await notify("Preparing to claim rewards...");

  try {
    const provider = getProvider(chainId);
    const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_TRACKER;

    const rewardTracker = getContract({
      address: rewardTrackerAddress,
      abi: RewardTracker,
      client: provider
    });

    // Check if there are rewards to claim
    const claimableAmount = await rewardTracker.read.claimable([account]) as bigint;
    
    if (claimableAmount <= 0n) {
      return toResult("No rewards available to claim", true);
    }

    await notify(`Claiming ${formatUnits(claimableAmount, 18)} wS rewards...`);

    const tx: TransactionParams = {
      target: rewardTrackerAddress,
      data: encodeFunctionData({
        abi: [{
          inputs: [{ name: 'account', type: 'address' }],
          name: 'claim',
          outputs: [{ type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function'
        }],
        functionName: 'claim',
        args: [account]
      }),
      value: BigInt(0)
    };

    const result = await sendTransactions({
      chainId,
      account,
      transactions: [tx]
    });

    if (!result.data || result.data.length === 0) {
      return toResult("Transaction failed: No transaction data returned", true);
    }

    const txHash = result.data[0]?.hash;
    if (!txHash) {
      return toResult("Transaction failed: No transaction hash returned", true);
    }

    return toResult(JSON.stringify({
      success: true,
      claimableAmount: claimableAmount.toString(),
      isMultisig: result.isMultisig,
      txHash,
      message: `Successfully claimed ${formatUnits(claimableAmount, 18)} wS rewards. Transaction hash: ${txHash}`
    }));
  } catch (error) {
    if (error instanceof Error) {
      return toResult(`Failed to claim rewards: ${error.message}`, true);
    }
    return toResult("Failed to claim rewards: Unknown error", true);
  }
} 