import { Address, encodeFunctionData, parseEther } from 'viem';
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, stETH_ADDRESS } from '../constants';
import stEthAbi from '../abis/stEthAbi';

interface Props {
  chainName: string; // Blockchain network name
  account: Address; // User's wallet address
  amount: string; // ETH amount to stake
}

/**
 * Stakes ETH into the Lido protocol and receives stETH in return.
 * @param {Props} params - An object containing the chain name, account address, and stake amount.
 * @param {FunctionOptions} options - An object containing `sendTransactions`, `getProvider`, and `notify` utilities.
 * @returns {Promise<FunctionReturn>} - A promise that resolves to a success message or an error message.
 */
export async function stakeETH(
  { chainName, account, amount }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) {
    return toResult('Wallet not connected', true);
  }

  // Get the chain ID from the chain name
  const chainId = getChainFromName(chainName);
  if (!chainId) {
    return toResult(`Unsupported chain name: ${chainName}`, true);
  }

  // Check if the chain is supported by the protocol
  if (!supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  // Validate the stake amount
  if (!amount || parseFloat(amount) <= 0) {
    return toResult('Invalid stake amount', true);
  }

  try {
    const amountInWei = parseEther(amount);
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"; // Referral address

    await notify(`Preparing to stake ${amount} ETH...`);

    const tx: TransactionParams = {
      target: stETH_ADDRESS, // Lido contract address
      data: encodeFunctionData({
        abi: stEthAbi,
        functionName: 'submit',
        args: [ZERO_ADDRESS], // ✅ Passing referral address (required)
      }),
      value: amountInWei, // ✅ ETH is passed correctly
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({
      chainId, // Chain ID of the network
      account, // User's wallet address
      transactions: [tx], // List of transactions to send
    });

    const stakeMessage = result.data[result.data.length - 1];

    return toResult(
      result.isMultisig
        ? stakeMessage.message
        : `Successfully staked ${amount} ETH. ${stakeMessage.message}`
    );
  } catch (error) {
    return toResult(
      `Failed to stake ETH: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}

 

